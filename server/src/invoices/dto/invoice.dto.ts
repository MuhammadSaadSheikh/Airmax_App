import {
  BillingPeriod,
  InvoiceEventType,
  InvoiceStatus,
  Prisma,
} from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateInvoiceDto {
  @IsString() @MinLength(1) @MaxLength(64) invoiceNumber!: string;
  @IsUUID('4') customerId!: string;
  @IsUUID('4') subscriptionId!: string;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) amount!: number;
  @IsDateString() billingStart!: string;
  @IsDateString() billingEnd!: string;
  @IsDateString() dueDate!: string;
}

export class UpdateInvoiceStatusDto {
  @IsEnum(InvoiceStatus) status!: InvoiceStatus;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(500) reason?: string;
}

export class CancelInvoiceDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(500) reason?: string;
}

export const invoiceInclude = {
  customer: { select: { userId: true } },
  events: { orderBy: { occurredAt: 'asc' as const } },
} satisfies Prisma.InvoiceInclude;

export type InvoiceRecord = Prisma.InvoiceGetPayload<{
  include: typeof invoiceInclude;
}>;

export class InvoiceEventResponseDto {
  readonly id: string;
  readonly type: InvoiceEventType;
  readonly actorId: string | null;
  readonly previousStatus: InvoiceStatus | null;
  readonly currentStatus: InvoiceStatus | null;
  readonly metadata: Prisma.JsonValue | null;
  readonly occurredAt: Date;
  constructor(event: InvoiceRecord['events'][number]) {
    this.id = event.id;
    this.type = event.type;
    this.actorId = event.actorId;
    this.previousStatus = event.previousStatus;
    this.currentStatus = event.currentStatus;
    this.metadata = event.metadata;
    this.occurredAt = event.occurredAt;
  }
}

export class InvoiceResponseDto {
  readonly id: string;
  readonly invoiceNumber: string;
  readonly customerId: string;
  readonly subscriptionId: string;
  readonly amount: string;
  readonly billingPeriod: BillingPeriod;
  readonly billingStart: Date;
  readonly billingEnd: Date;
  readonly dueDate: Date;
  readonly status: InvoiceStatus;
  readonly customerName: string;
  readonly customerContact: string | null;
  readonly packageName: string;
  readonly packageSpeedMbps: number;
  readonly paidAt: Date | null;
  readonly cancelledAt: Date | null;
  readonly events: InvoiceEventResponseDto[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
  constructor(invoice: InvoiceRecord) {
    this.id = invoice.id;
    this.invoiceNumber = invoice.number;
    this.customerId = invoice.customerId;
    this.subscriptionId = invoice.subscriptionId;
    this.amount = invoice.amount.toString();
    this.billingPeriod = invoice.billingPeriod;
    this.billingStart = invoice.periodStart;
    this.billingEnd = invoice.periodEnd;
    this.dueDate = invoice.dueAt;
    this.status = invoice.status;
    this.customerName = invoice.customerNameSnapshot;
    this.customerContact = invoice.customerPhoneSnapshot;
    this.packageName = invoice.packageNameSnapshot;
    this.packageSpeedMbps = invoice.packageSpeedSnapshot;
    this.paidAt = invoice.paidAt;
    this.cancelledAt = invoice.cancelledAt;
    this.events = invoice.events.map(
      event => new InvoiceEventResponseDto(event),
    );
    this.createdAt = invoice.createdAt;
    this.updatedAt = invoice.updatedAt;
  }
}
