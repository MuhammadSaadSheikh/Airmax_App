import { PaymentAttemptStatus, PaymentStatus, Prisma } from '@prisma/client';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreatePaymentDto {
  @IsUUID('4') invoiceId!: string;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) amount!: number;
  @IsString() @MinLength(1) @MaxLength(64) paymentMethod!: string;
  @IsIn([PaymentStatus.SUCCESS, PaymentStatus.FAILED, PaymentStatus.PENDING])
  status!: PaymentStatus;
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  externalReference?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(64) provider?: string;
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  providerReference?: string;
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  failureReason?: string;
}

export class RefundPaymentDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(500) reason?: string;
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  providerReference?: string;
}

export const paymentInclude = {
  customer: { select: { userId: true } },
  attempts: { orderBy: { attemptedAt: 'asc' as const } },
} satisfies Prisma.PaymentInclude;

export type PaymentRecord = Prisma.PaymentGetPayload<{
  include: typeof paymentInclude;
}>;

export class PaymentAttemptResponseDto {
  readonly id: string;
  readonly status: PaymentAttemptStatus;
  readonly provider: string | null;
  readonly providerReference: string | null;
  readonly failureReason: string | null;
  readonly metadata: Prisma.JsonValue | null;
  readonly attemptedAt: Date;
  constructor(attempt: PaymentRecord['attempts'][number]) {
    this.id = attempt.id;
    this.status = attempt.status;
    this.provider = attempt.provider;
    this.providerReference = attempt.providerReference;
    this.failureReason = attempt.failureReason;
    this.metadata = attempt.metadata;
    this.attemptedAt = attempt.attemptedAt;
  }
}

export class PaymentResponseDto {
  readonly id: string;
  readonly invoiceId: string;
  readonly customerId: string;
  readonly amount: string;
  readonly paymentMethod: string;
  readonly status: PaymentStatus;
  readonly externalReference: string | null;
  readonly attempts: PaymentAttemptResponseDto[];
  readonly processedAt: Date | null;
  readonly refundedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  constructor(payment: PaymentRecord) {
    this.id = payment.id;
    this.invoiceId = payment.invoiceId;
    this.customerId = payment.customerId;
    this.amount = payment.amount.toString();
    this.paymentMethod = payment.method;
    this.status = payment.status;
    this.externalReference = payment.externalReference;
    this.attempts = payment.attempts.map(
      item => new PaymentAttemptResponseDto(item),
    );
    this.processedAt = payment.processedAt;
    this.refundedAt = payment.refundedAt;
    this.createdAt = payment.createdAt;
    this.updatedAt = payment.updatedAt;
  }
}
