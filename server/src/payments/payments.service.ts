import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InvoiceStatus,
  PaymentAttemptStatus,
  PaymentStatus,
  Prisma,
  Role,
} from '@prisma/client';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import {
  ConfirmPaymentDto,
  CreatePaymentDto,
  InitiatePaymentDto,
  type PaymentRecord,
  PaymentResponseDto,
  RefundPaymentDto,
} from './dto/payment.dto';
import { PaymentsRepository } from './payments.repository';

@Injectable()
export class PaymentsService {
  constructor(private readonly payments: PaymentsRepository) {}

  async initiatePayment(
    input: InitiatePaymentDto,
    idempotencyKey: string | undefined,
    actor: AuthUser,
  ) {
    this.assertCustomer(actor);
    const key = this.validateIdempotencyKey(idempotencyKey);
    const customer = await this.payments.findCustomerByUserId(actor.sub);
    if (!customer) throw new NotFoundException('Customer not found');

    const prior = await this.payments.findByIdempotencyKey(key);
    if (prior) {
      this.assertCanView(prior.customer.userId, actor);
      this.assertSameInitiation(prior, input);
      return new PaymentResponseDto(prior);
    }
    try {
      const result = await this.payments.initiateCustomerPayment({
        invoiceId: input.invoiceId,
        customerUserId: actor.sub,
        method: input.paymentMethod,
        idempotencyKey: key,
        providerMetadata: input.providerMetadata,
      });
      if (result.kind === 'missing') {
        throw new NotFoundException('Invoice not found');
      }
      if (result.kind === 'forbidden') {
        throw new ForbiddenException('Invoice access denied');
      }
      if (result.kind === 'invalid_subscription') {
        throw new ConflictException(
          'Invoice subscription ownership is no longer valid',
        );
      }
      if (result.kind === 'invoice_not_payable') {
        throw new ConflictException(
          `Invoice in ${result.status} status cannot receive payment`,
        );
      }
      if (result.kind === 'active_attempt') {
        throw new ConflictException(
          'Invoice already has an active payment attempt',
        );
      }
      if (result.kind === 'idempotent') {
        this.assertCanView(result.payment.customer.userId, actor);
        this.assertSameInitiation(result.payment, input);
      }
      return new PaymentResponseDto(result.payment);
    } catch (error) {
      if (this.isUniqueConflict(error)) {
        const concurrent = await this.payments.findByIdempotencyKey(key);
        if (concurrent) {
          this.assertCanView(concurrent.customer.userId, actor);
          this.assertSameInitiation(concurrent, input);
          return new PaymentResponseDto(concurrent);
        }
      }
      this.rethrowUniqueConflict(error);
    }
  }

  async confirmPayment(id: string, input: ConfirmPaymentDto, actor: AuthUser) {
    this.assertAdmin(actor);
    if (
      input.result !== PaymentAttemptStatus.SUCCESS &&
      input.result !== PaymentAttemptStatus.FAILED
    ) {
      throw new BadRequestException('Payment confirmation result is invalid');
    }
    if (input.result === PaymentAttemptStatus.FAILED && !input.failureReason) {
      throw new BadRequestException(
        'Failed payment confirmation requires a safe failure reason',
      );
    }
    try {
      const result = await this.payments.confirmCustomerPayment({
        id,
        actorId: actor.sub,
        result: input.result,
        provider: input.provider,
        providerReference: input.providerReference,
        failureReason: input.failureReason,
      });
      if (result.kind === 'missing') {
        throw new NotFoundException('Payment not found');
      }
      if (result.kind === 'invoice_missing') {
        throw new NotFoundException('Invoice not found');
      }
      if (result.kind === 'payment_changed') {
        throw new ConflictException('Payment is no longer pending');
      }
      if (result.kind === 'invoice_changed') {
        throw new ConflictException('Invoice is no longer payable');
      }
      return new PaymentResponseDto(result.payment);
    } catch (error) {
      this.rethrowUniqueConflict(error);
    }
  }

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
  private assertCustomer(actor: AuthUser) {
    if (actor.role !== Role.CUSTOMER) {
      throw new ForbiddenException('Customer payment initiation denied');
    }
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
  private assertSameInitiation(
    payment: PaymentRecord,
    input: InitiatePaymentDto,
  ) {
    if (
      payment.invoiceId !== input.invoiceId ||
      payment.method !== input.paymentMethod
    ) {
      throw new ConflictException(
        'Idempotency key was used for a different payment',
      );
    }
  }
  private rethrowUniqueConflict(error: unknown): never {
    if (this.isUniqueConflict(error)) {
      throw new ConflictException('Payment reference already exists');
    }
    throw error;
  }
  private isUniqueConflict(
    error: unknown,
  ): error is Prisma.PrismaClientKnownRequestError {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
