import { Injectable } from '@nestjs/common';
import { PackageStatus, Prisma, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { subscriptionInclude } from './dto/subscription.dto';

const LIVE_STATUSES = [
  SubscriptionStatus.PENDING,
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.SUSPENDED,
];

@Injectable()
export class SubscriptionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCustomerById(id: string) {
    return this.prisma.customer.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });
  }
  findPackageById(id: string) {
    return this.prisma.package.findUnique({ where: { id } });
  }
  findById(id: string) {
    return this.prisma.subscription.findUnique({
      where: { id },
      include: subscriptionInclude,
    });
  }
  findByCustomerId(customerId: string) {
    return this.prisma.subscription.findMany({
      where: { customerId },
      include: subscriptionInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createIfNoLive(
    customerId: string,
    packageId: string,
    expectedPackageUpdatedAt: Date,
    data: Prisma.SubscriptionCreateInput,
  ) {
    return this.prisma.$transaction(async transaction => {
      await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${customerId}, 0))`;
      const packages = await transaction.$queryRaw<
        Array<{ status: PackageStatus; updatedAt: Date }>
      >`SELECT "status", "updatedAt" FROM "Package" WHERE "id" = ${packageId}::uuid FOR SHARE`;
      const lockedPackage = packages[0];
      if (
        !lockedPackage ||
        lockedPackage.status !== PackageStatus.ACTIVE ||
        lockedPackage.updatedAt.getTime() !== expectedPackageUpdatedAt.getTime()
      ) {
        return { kind: 'package_changed' as const };
      }
      const existing = await transaction.subscription.findFirst({
        where: { customerId, status: { in: LIVE_STATUSES } },
        select: { id: true },
      });
      if (existing) return { kind: 'duplicate' as const };
      return {
        kind: 'created' as const,
        subscription: await transaction.subscription.create({
          data,
          include: subscriptionInclude,
        }),
      };
    });
  }

  async updateWithActivePackage(
    id: string,
    packageId: string,
    expectedPackageUpdatedAt: Date,
    data: Prisma.SubscriptionUpdateInput,
  ) {
    return this.prisma.$transaction(async transaction => {
      const packages = await transaction.$queryRaw<
        Array<{ status: PackageStatus; updatedAt: Date }>
      >`SELECT "status", "updatedAt" FROM "Package" WHERE "id" = ${packageId}::uuid FOR SHARE`;
      const lockedPackage = packages[0];
      if (
        !lockedPackage ||
        lockedPackage.status !== PackageStatus.ACTIVE ||
        lockedPackage.updatedAt.getTime() !== expectedPackageUpdatedAt.getTime()
      ) {
        return null;
      }
      return transaction.subscription.update({
        where: { id },
        data,
        include: subscriptionInclude,
      });
    });
  }

  update(id: string, data: Prisma.SubscriptionUpdateInput) {
    return this.prisma.subscription.update({
      where: { id },
      data,
      include: subscriptionInclude,
    });
  }
}
