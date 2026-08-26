import {
  Prisma,
  SubscriptionHistoryType,
  SubscriptionStatus,
} from '@prisma/client';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PackageResponseDto } from '../../packages/dto/package.dto';

export class CreateSubscriptionDto {
  @IsUUID('4') customerId!: string;
  @IsUUID('4') packageId!: string;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
}

export class ChangeSubscriptionPackageDto {
  @IsUUID('4') packageId!: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(500) reason?: string;
}

export class CancelSubscriptionDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(500) reason?: string;
}

export const subscriptionInclude = {
  customer: { select: { userId: true } },
  package: true,
  history: { orderBy: { occurredAt: 'asc' as const } },
} satisfies Prisma.SubscriptionInclude;

export type SubscriptionRecord = Prisma.SubscriptionGetPayload<{
  include: typeof subscriptionInclude;
}>;

export class SubscriptionHistoryResponseDto {
  readonly id: string;
  readonly type: SubscriptionHistoryType;
  readonly actorId: string | null;
  readonly previousStatus: SubscriptionStatus | null;
  readonly currentStatus: SubscriptionStatus | null;
  readonly previousPackageId: string | null;
  readonly currentPackageId: string | null;
  readonly packageName: string | null;
  readonly packageSpeedMbps: number | null;
  readonly packagePrice: string | null;
  readonly metadata: Prisma.JsonValue | null;
  readonly occurredAt: Date;

  constructor(history: SubscriptionRecord['history'][number]) {
    this.id = history.id;
    this.type = history.type;
    this.actorId = history.actorId;
    this.previousStatus = history.previousStatus;
    this.currentStatus = history.currentStatus;
    this.previousPackageId = history.previousPackageId;
    this.currentPackageId = history.currentPackageId;
    this.packageName = history.packageName;
    this.packageSpeedMbps = history.packageSpeedMbps;
    this.packagePrice = history.packagePrice?.toString() ?? null;
    this.metadata = history.metadata;
    this.occurredAt = history.occurredAt;
  }
}

export class SubscriptionResponseDto {
  readonly id: string;
  readonly customerId: string;
  readonly packageId: string;
  readonly status: SubscriptionStatus;
  readonly startsAt: Date;
  readonly endsAt: Date | null;
  readonly cancelledAt: Date | null;
  readonly package: PackageResponseDto;
  readonly history: SubscriptionHistoryResponseDto[];
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(subscription: SubscriptionRecord) {
    this.id = subscription.id;
    this.customerId = subscription.customerId;
    this.packageId = subscription.packageId;
    this.status = subscription.status;
    this.startsAt = subscription.startsAt;
    this.endsAt = subscription.endsAt;
    this.cancelledAt = subscription.cancelledAt;
    this.package = new PackageResponseDto(subscription.package);
    this.history = subscription.history.map(
      item => new SubscriptionHistoryResponseDto(item),
    );
    this.createdAt = subscription.createdAt;
    this.updatedAt = subscription.updatedAt;
  }
}
