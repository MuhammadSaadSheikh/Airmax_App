import { Injectable } from '@nestjs/common';
import {
  InvoiceEventType,
  InvoiceStatus,
  PaymentAttemptStatus,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { invoiceInclude } from '../invoices/dto/invoice.dto';
import { paymentInclude } from './dto/payment.dto';

@Injectable()
export class PaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCustomerByUserId(userId: string) {
    return this.prisma.customer.findUnique({
      where: { userId },
      select: { id: true, userId: true },
    });
  }
  findInvoiceById(id: string) {
    return this.prisma.invoice.findUnique({
      where: { id },
      include: invoiceInclude,
    });
  }
  findById(id: string) {
    return this.prisma.payment.findUnique({
      where: { id },
      include: paymentInclude,
    });
  }
  findByIdempotencyKey(idempotencyKey: string) {
    return this.prisma.payment.findUnique({
      where: { idempotencyKey },
      include: paymentInclude,
    });
  }
  findByInvoiceId(invoiceId: string) {
    return this.prisma.payment.findMany({
      where: { invoiceId },
      include: paymentInclude,
      orderBy: { createdAt: 'asc' },
    });
  }

  async initiateCustomerPayment(input: {
    invoiceId: string;
    customerUserId: string;
    method: string;
    idempotencyKey: string;
    providerMetadata?: Prisma.InputJsonObject;
  }) {
    return this.prisma.$transaction(async transaction => {
      const existing = await transaction.payment.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        include: paymentInclude,
      });
      if (existing) return { kind: 'idempotent' as const, payment: existing };

      const locked = await transaction.$queryRaw<
        Array<{
          amount: Prisma.Decimal;
          customerId: string;
          status: InvoiceStatus;
          subscriptionId: string;
        }>
      >`SELECT "amount", "customerId", "status", "subscriptionId" FROM "Invoice" WHERE "id" = ${input.invoiceId}::uuid FOR UPDATE`;
      const invoice = locked[0];
      if (!invoice) return { kind: 'missing' as const };

      // A same-key request may have committed while this transaction waited for
      // the invoice lock. Recheck before validating active attempts.
      const committedRetry = await transaction.payment.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        include: paymentInclude,
      });
      if (committedRetry) {
        return { kind: 'idempotent' as const, payment: committedRetry };
      }

      const customer = await transaction.customer.findUnique({
        where: { id: invoice.customerId },
        select: { userId: true },
      });
      if (!customer || customer.userId !== input.customerUserId) {
        return { kind: 'forbidden' as const };
      }
      const subscription = await transaction.subscription.findUnique({
        where: { id: invoice.subscriptionId },
        select: { customerId: true },
      });
      if (!subscription || subscription.customerId !== invoice.customerId) {
        return { kind: 'invalid_subscription' as const };
      }
      if (
        invoice.status !== InvoiceStatus.PENDING &&
        invoice.status !== InvoiceStatus.OVERDUE
      ) {
        return {
          kind: 'invoice_not_payable' as const,
          status: invoice.status,
        };
      }
      const active = await transaction.payment.findFirst({
        where: { invoiceId: input.invoiceId, status: PaymentStatus.PENDING },
        select: { id: true },
      });
      if (active) return { kind: 'active_attempt' as const };

      const metadata: Prisma.InputJsonObject = {
        event: 'PAYMENT_INITIATED',
        ...(input.providerMetadata
          ? { providerMetadata: input.providerMetadata }
          : {}),
      };
      const payment = await transaction.payment.create({
        data: {
          invoice: { connect: { id: input.invoiceId } },
          customer: { connect: { id: invoice.customerId } },
          amount: invoice.amount,
          method: input.method,
          status: PaymentStatus.PENDING,
          idempotencyKey: input.idempotencyKey,
          attempts: {
            create: {
              status: PaymentAttemptStatus.PENDING,
              metadata,
            },
          },
        },
        include: paymentInclude,
      });
      return { kind: 'created' as const, payment };
    });
  }

  async confirmCustomerPayment(input: {
    id: string;
    actorId: string;
    result: Extract<PaymentAttemptStatus, 'SUCCESS' | 'FAILED'>;
    provider?: string;
    providerReference: string;
    failureReason?: string;
  }) {
    return this.prisma.$transaction(async transaction => {
      const paymentReference = await transaction.payment.findUnique({
        where: { id: input.id },
        select: { invoiceId: true },
      });
      if (!paymentReference) return { kind: 'missing' as const };

      const lockedInvoice = await transaction.$queryRaw<
        Array<{ status: InvoiceStatus }>
      >`SELECT "status" FROM "Invoice" WHERE "id" = ${paymentReference.invoiceId}::uuid FOR UPDATE`;
      if (!lockedInvoice[0]) return { kind: 'invoice_missing' as const };
      const lockedPayment = await transaction.$queryRaw<
        Array<{ status: PaymentStatus }>
      >`SELECT "status" FROM "Payment" WHERE "id" = ${input.id}::uuid FOR UPDATE`;
      if (!lockedPayment[0]) return { kind: 'missing' as const };
      if (lockedPayment[0].status !== PaymentStatus.PENDING) {
        return { kind: 'payment_changed' as const };
      }

      const successful = input.result === PaymentAttemptStatus.SUCCESS;
      if (
        successful &&
        lockedInvoice[0].status !== InvoiceStatus.PENDING &&
        lockedInvoice[0].status !== InvoiceStatus.OVERDUE
      ) {
        return { kind: 'invoice_changed' as const };
      }
      const paymentStatus = successful
        ? PaymentStatus.SUCCESS
        : PaymentStatus.FAILED;
      const changed = await transaction.payment.updateMany({
        where: { id: input.id, status: PaymentStatus.PENDING },
        data: {
          status: paymentStatus,
          externalReference: input.providerReference,
          processedAt: new Date(),
        },
      });
      if (changed.count !== 1) return { kind: 'payment_changed' as const };
      await transaction.paymentAttempt.create({
        data: {
          paymentId: input.id,
          status: input.result,
          provider: input.provider,
          providerReference: input.providerReference,
          failureReason: input.failureReason,
          metadata: { event: 'PAYMENT_CONFIRMED', result: input.result },
        },
      });

      if (successful) {
        await transaction.invoice.update({
          where: { id: paymentReference.invoiceId },
          data: {
            status: InvoiceStatus.PAID,
            paidAt: new Date(),
            events: {
              create: {
                type: InvoiceEventType.MARKED_PAID,
                actor: { connect: { id: input.actorId } },
                previousStatus: lockedInvoice[0].status,
                currentStatus: InvoiceStatus.PAID,
                metadata: {
                  event: 'PAYMENT_APPLIED',
                  paymentId: input.id,
                },
              },
            },
          },
        });
      }
      return {
        kind: 'confirmed' as const,
        payment: await transaction.payment.findUniqueOrThrow({
          where: { id: input.id },
          include: paymentInclude,
        }),
      };
    });
  }

  async recordPayment(input: {
    invoiceId: string;
    expectedInvoiceStatus: InvoiceStatus;
    actorId: string;
    amount: Prisma.Decimal;
    method: string;
    status: PaymentStatus;
    externalReference?: string;
    idempotencyKey: string;
    provider?: string;
    providerReference?: string;
    failureReason?: string;
  }) {
    return this.prisma.$transaction(async transaction => {
      const existing = await transaction.payment.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        include: paymentInclude,
      });
      if (existing) return { kind: 'idempotent' as const, payment: existing };

      const locked = await transaction.$queryRaw<
        Array<{ status: InvoiceStatus }>
      >`SELECT "status" FROM "Invoice" WHERE "id" = ${input.invoiceId}::uuid FOR UPDATE`;
      if (!locked[0]) return { kind: 'missing' as const };
      // A same-key request may have committed while this transaction waited for
      // the invoice lock. Recheck so concurrent retries remain idempotent.
      const committedRetry = await transaction.payment.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        include: paymentInclude,
      });
      if (committedRetry) {
        return { kind: 'idempotent' as const, payment: committedRetry };
      }
      if (locked[0].status !== input.expectedInvoiceStatus) {
        return { kind: 'invoice_changed' as const };
      }

      const payment = await transaction.payment.create({
        data: {
          invoice: { connect: { id: input.invoiceId } },
          customer: {
            connect: {
              id: (
                await transaction.invoice.findUniqueOrThrow({
                  where: { id: input.invoiceId },
                  select: { customerId: true },
                })
              ).customerId,
            },
          },
          amount: input.amount,
          method: input.method,
          status: input.status,
          externalReference: input.externalReference,
          idempotencyKey: input.idempotencyKey,
          processedAt:
            input.status === PaymentStatus.PENDING ? undefined : new Date(),
          attempts: {
            create: {
              status: this.attemptStatus(input.status),
              provider: input.provider,
              providerReference: input.providerReference,
              failureReason: input.failureReason,
              metadata: {
                event: 'PAYMENT_ATTEMPT',
                paymentStatus: input.status,
              },
            },
          },
        },
        include: paymentInclude,
      });

      if (input.status === PaymentStatus.SUCCESS) {
        await transaction.invoice.update({
          where: { id: input.invoiceId },
          data: {
            status: InvoiceStatus.PAID,
            paidAt: new Date(),
            events: {
              create: {
                type: InvoiceEventType.MARKED_PAID,
                actor: { connect: { id: input.actorId } },
                previousStatus: input.expectedInvoiceStatus,
                currentStatus: InvoiceStatus.PAID,
                metadata: {
                  event: 'PAYMENT_APPLIED',
                  paymentId: payment.id,
                  amount: input.amount.toString(),
                  method: input.method,
                },
              },
            },
          },
        });
      }
      return { kind: 'created' as const, payment };
    });
  }

  async refund(input: {
    id: string;
    expectedStatus: PaymentStatus;
    reason?: string;
    providerReference?: string;
  }) {
    return this.prisma.$transaction(async transaction => {
      const changed = await transaction.payment.updateMany({
        where: { id: input.id, status: input.expectedStatus },
        data: { status: PaymentStatus.REFUNDED, refundedAt: new Date() },
      });
      if (changed.count !== 1) return null;
      await transaction.paymentAttempt.create({
        data: {
          paymentId: input.id,
          status: PaymentAttemptStatus.SUCCESS,
          providerReference: input.providerReference,
          metadata: { event: 'REFUNDED', reason: input.reason },
        },
      });
      return transaction.payment.findUniqueOrThrow({
        where: { id: input.id },
        include: paymentInclude,
      });
    });
  }

  private attemptStatus(status: PaymentStatus): PaymentAttemptStatus {
    if (status === PaymentStatus.SUCCESS) return PaymentAttemptStatus.SUCCESS;
    if (status === PaymentStatus.FAILED) return PaymentAttemptStatus.FAILED;
    return PaymentAttemptStatus.PENDING;
  }
}
