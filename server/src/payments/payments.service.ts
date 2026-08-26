import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InvoiceStatus, PaymentStatus, Prisma, Role } from '@prisma/client';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import {
  CreatePaymentDto,
  type PaymentRecord,
  PaymentResponseDto,
  RefundPaymentDto,
} from './dto/payment.dto';
import { PaymentsRepository } from './payments.repository';

@Injectable()
export class PaymentsService {
  constructor(private readonly payments: PaymentsRepository) {}

  async createPayment(
    input: CreatePaymentDto,
    idempotencyKey: string | undefined,
    actor: AuthUser,
  ) {
    this.assertAdmin(actor);
    const key = this.validateIdempotencyKey(idempotencyKey);
    const prior = await this.payments.findByIdempotencyKey(key);
    if (prior) {
      this.assertSameRequest(prior, input);
      return new PaymentResponseDto(prior);
    }
    const invoice = await this.payments.findInvoiceById(input.invoiceId);
    if (!invoice) throw new NotFoundException('Invoice not found');
    this.assertInvoicePayable(invoice.status);
    if (!invoice.amount.equals(input.amount)) {
      throw new BadRequestException('Payment amount must equal invoice amount');
    }
    if (input.status === PaymentStatus.FAILED && !input.failureReason) {
      throw new BadRequestException(
        'Failed payment requires a safe failure reason',
      );
    }
    try {
      const result = await this.payments.recordPayment({
        invoiceId: invoice.id,
        expectedInvoiceStatus: invoice.status,
        actorId: actor.sub,
        amount: new Prisma.Decimal(input.amount),
        method: input.paymentMethod,
        status: input.status,
        externalReference: input.externalReference,
        idempotencyKey: key,
        provider: input.provider,
        providerReference: input.providerReference,
        failureReason: input.failureReason,
      });
      if (result.kind === 'missing')
        throw new NotFoundException('Invoice not found');
      if (result.kind === 'invoice_changed')
        throw new ConflictException('Invoice changed concurrently');
      if (result.kind === 'idempotent')
        this.assertSameRequest(result.payment, input);
      return new PaymentResponseDto(result.payment);
    } catch (error) {
      this.rethrowUniqueConflict(error);
    }
  }

  async getPaymentById(id: string, actor: AuthUser) {
    const payment = await this.findPayment(id);
    this.assertCanView(payment.customer.userId, actor);
    return new PaymentResponseDto(payment);
  }

  async getInvoicePayments(invoiceId: string, actor: AuthUser) {
    const invoice = await this.payments.findInvoiceById(invoiceId);
    if (!invoice) throw new NotFoundException('Invoice not found');
    this.assertCanView(invoice.customer.userId, actor);
    return (await this.payments.findByInvoiceId(invoiceId)).map(
      item => new PaymentResponseDto(item),
    );
  }

  async refundPayment(id: string, input: RefundPaymentDto, actor: AuthUser) {
    this.assertAdmin(actor);
    const payment = await this.findPayment(id);
    if (payment.status !== PaymentStatus.SUCCESS) {
      throw new ConflictException('Only successful payments can be refunded');
    }
    const refunded = await this.payments.refund({
      id,
      expectedStatus: payment.status,
      reason: input.reason,
      providerReference: input.providerReference,
    });
    if (!refunded) throw new ConflictException('Payment changed concurrently');
    return new PaymentResponseDto(refunded);
  }

  private async findPayment(id: string) {
    const payment = await this.payments.findById(id);
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }
  private assertInvoicePayable(status: InvoiceStatus) {
    if (status !== InvoiceStatus.PENDING && status !== InvoiceStatus.OVERDUE) {
      throw new ConflictException(
        `Invoice in ${status} status cannot receive payment`,
      );
    }
  }
  private assertAdmin(actor: AuthUser) {
    if (actor.role !== Role.ADMIN)
      throw new ForbiddenException('Payment mutation denied');
  }
  private assertCanView(userId: string, actor: AuthUser) {
    if (actor.role !== Role.ADMIN && actor.sub !== userId)
      throw new ForbiddenException('Payment access denied');
  }
  private validateIdempotencyKey(key: string | undefined) {
    if (!key || key.length > 255)
      throw new BadRequestException('A valid idempotency key is required');
    return key;
  }
  private assertSameRequest(payment: PaymentRecord, input: CreatePaymentDto) {
    if (
      payment.invoiceId !== input.invoiceId ||
      !payment.amount.equals(input.amount) ||
      payment.method !== input.paymentMethod
    ) {
      throw new ConflictException(
        'Idempotency key was used for a different payment',
      );
    }
  }
  private rethrowUniqueConflict(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Payment reference already exists');
    }
    throw error;
  }
}
