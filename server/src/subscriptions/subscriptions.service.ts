import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PackageStatus,
  Prisma,
  Role,
  SubscriptionHistoryType,
  SubscriptionStatus,
} from '@prisma/client';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import type { PackageRecord } from '../packages/dto/package.dto';
import {
  ChangeSubscriptionPackageDto,
  CreateSubscriptionDto,
  SubscriptionResponseDto,
} from './dto/subscription.dto';
import { SubscriptionsRepository } from './subscriptions.repository';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly subscriptions: SubscriptionsRepository) {}

  async createSubscription(input: CreateSubscriptionDto, actor: AuthUser) {
    const [customer, packageRecord] = await Promise.all([
      this.subscriptions.findCustomerById(input.customerId),
      this.subscriptions.findPackageById(input.packageId),
    ]);
    if (!customer) throw new NotFoundException('Customer not found');
    this.assertCanAccess(customer.userId, actor);
    this.assertPackageAvailable(packageRecord);
    const startsAt = input.startsAt ? new Date(input.startsAt) : new Date();
    const endsAt = input.endsAt ? new Date(input.endsAt) : undefined;
    if (endsAt && endsAt <= startsAt)
      throw new BadRequestException('Subscription end must be after start');

    const created = await this.subscriptions.createIfNoLive(
      customer.id,
      packageRecord.id,
      packageRecord.updatedAt,
      {
        customer: { connect: { id: customer.id } },
        package: { connect: { id: packageRecord.id } },
        startsAt,
        endsAt,
        history: {
          create: {
            type: SubscriptionHistoryType.CREATED,
            actor: { connect: { id: actor.sub } },
            currentStatus: SubscriptionStatus.PENDING,
            currentPackage: { connect: { id: packageRecord.id } },
            ...this.snapshotColumns(packageRecord),
            metadata: {
              event: 'CREATED',
              currentPackage: this.packageSnapshot(packageRecord),
            },
          },
        },
      },
    );
    if (created.kind === 'package_changed') {
      throw new ConflictException(
        'Package changed; retry subscription creation',
      );
    }
    if (created.kind === 'duplicate')
      throw new ConflictException('Customer already has a live subscription');
    return new SubscriptionResponseDto(created.subscription);
  }

  async getSubscriptionById(id: string, actor: AuthUser) {
    const subscription = await this.findSubscription(id);
    this.assertCanAccess(subscription.customer.userId, actor);
    return new SubscriptionResponseDto(subscription);
  }

  async getCustomerSubscriptions(customerId: string, actor: AuthUser) {
    const customer = await this.subscriptions.findCustomerById(customerId);
    if (!customer) throw new NotFoundException('Customer not found');
    this.assertCanAccess(customer.userId, actor);
    return (await this.subscriptions.findByCustomerId(customerId)).map(
      item => new SubscriptionResponseDto(item),
    );
  }

  async changeSubscriptionPackage(
    id: string,
    input: ChangeSubscriptionPackageDto,
    actor: AuthUser,
  ) {
    const [subscription, nextPackage] = await Promise.all([
      this.findSubscription(id),
      this.subscriptions.findPackageById(input.packageId),
    ]);
    this.assertCanAccess(subscription.customer.userId, actor);
    this.assertMutable(subscription.status);
    this.assertPackageAvailable(nextPackage);
    if (subscription.packageId === nextPackage.id)
      throw new ConflictException('Subscription already uses this package');

    const changed = await this.subscriptions.updateWithActivePackage(
      id,
      nextPackage.id,
      nextPackage.updatedAt,
      {
        package: { connect: { id: nextPackage.id } },
        history: {
          create: {
            type: SubscriptionHistoryType.PACKAGE_CHANGED,
            actor: { connect: { id: actor.sub } },
            previousStatus: subscription.status,
            currentStatus: subscription.status,
            previousPackage: { connect: { id: subscription.package.id } },
            currentPackage: { connect: { id: nextPackage.id } },
            ...this.snapshotColumns(nextPackage),
            metadata: {
              event: 'PACKAGE_CHANGED',
              reason: input.reason,
              previousPackage: this.packageSnapshot(subscription.package),
              currentPackage: this.packageSnapshot(nextPackage),
            },
          },
        },
      },
    );
    if (!changed) {
      throw new ConflictException('Package changed; retry package selection');
    }
    return new SubscriptionResponseDto(changed);
  }

  async cancelSubscription(
    id: string,
    reason: string | undefined,
    actor: AuthUser,
  ) {
    const subscription = await this.findSubscription(id);
    this.assertCanAccess(subscription.customer.userId, actor);
    this.assertMutable(subscription.status);
    return new SubscriptionResponseDto(
      await this.subscriptions.update(id, {
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
        history: {
          create: {
            type: SubscriptionHistoryType.CANCELLED,
            actor: { connect: { id: actor.sub } },
            previousStatus: subscription.status,
            currentStatus: SubscriptionStatus.CANCELLED,
            currentPackage: { connect: { id: subscription.package.id } },
            ...this.snapshotColumns(subscription.package),
            metadata: {
              event: 'CANCELLED',
              reason,
              currentPackage: this.packageSnapshot(subscription.package),
            },
          },
        },
      }),
    );
  }

  async activateSubscription(id: string, actor: AuthUser) {
    if (actor.role !== Role.ADMIN)
      throw new ForbiddenException('Subscription activation denied');
    const subscription = await this.findSubscription(id);
    this.assertMutable(subscription.status);
    if (subscription.status === SubscriptionStatus.ACTIVE)
      throw new ConflictException('Subscription is already active');
    return new SubscriptionResponseDto(
      await this.subscriptions.update(id, {
        status: SubscriptionStatus.ACTIVE,
        history: {
          create: {
            type: SubscriptionHistoryType.STATUS_CHANGED,
            actor: { connect: { id: actor.sub } },
            previousStatus: subscription.status,
            currentStatus: SubscriptionStatus.ACTIVE,
            currentPackage: { connect: { id: subscription.package.id } },
            ...this.snapshotColumns(subscription.package),
            metadata: {
              event: 'ACTIVATED',
              currentPackage: this.packageSnapshot(subscription.package),
            },
          },
        },
      }),
    );
  }

  private async findSubscription(id: string) {
    const subscription = await this.subscriptions.findById(id);
    if (!subscription) throw new NotFoundException('Subscription not found');
    return subscription;
  }
  private assertPackageAvailable(
    record: PackageRecord | null,
  ): asserts record is PackageRecord {
    if (!record) throw new NotFoundException('Package not found');
    if (record.status !== PackageStatus.ACTIVE)
      throw new ConflictException('Package is inactive');
  }
  private assertCanAccess(userId: string, actor: AuthUser) {
    if (actor.role !== Role.ADMIN && actor.sub !== userId)
      throw new ForbiddenException('Subscription access denied');
  }
  private assertMutable(status: SubscriptionStatus) {
    if (
      status === SubscriptionStatus.CANCELLED ||
      status === SubscriptionStatus.EXPIRED
    ) {
      throw new ConflictException('Subscription is in a terminal state');
    }
  }
  private packageSnapshot(record: PackageRecord): Prisma.InputJsonObject {
    return {
      id: record.id,
      name: record.name,
      speedMbps: record.speedMbps,
      price: record.price.toString(),
      billingPeriod: record.billingPeriod,
    };
  }
  private snapshotColumns(record: PackageRecord) {
    return {
      packageName: record.name,
      packageSpeedMbps: record.speedMbps,
      packagePrice: record.price,
      billingPeriod: record.billingPeriod,
    };
  }
}
