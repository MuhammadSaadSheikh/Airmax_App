import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InvoiceEventType,
  InvoiceStatus,
  Prisma,
  Role,
  SubscriptionStatus,
} from '@prisma/client';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import {
  CancelInvoiceDto,
  CreateInvoiceDto,
  InvoiceResponseDto,
  UpdateInvoiceStatusDto,
} from './dto/invoice.dto';
import { InvoicesRepository } from './invoices.repository';

const TRANSITIONS: Record<InvoiceStatus, readonly InvoiceStatus[]> = {
  GENERATED: [InvoiceStatus.PENDING, InvoiceStatus.CANCELLED],
  PENDING: [InvoiceStatus.PAID, InvoiceStatus.OVERDUE, InvoiceStatus.CANCELLED],
  OVERDUE: [InvoiceStatus.PAID, InvoiceStatus.CANCELLED],
  PAID: [],
  CANCELLED: [],
};

@Injectable()
export class InvoicesService {
  constructor(private readonly invoices: InvoicesRepository) {}

  async createInvoice(input: CreateInvoiceDto, actor: AuthUser) {
    this.assertAdmin(actor);
    const subscription = await this.invoices.findSubscription(
      input.subscriptionId,
    );
    if (!subscription) throw new NotFoundException('Subscription not found');
    if (subscription.customerId !== input.customerId) {
      throw new BadRequestException('Subscription does not belong to customer');
    }
    if (
      subscription.status === SubscriptionStatus.CANCELLED ||
      subscription.status === SubscriptionStatus.EXPIRED
    ) {
      throw new ConflictException('Cannot invoice a terminal subscription');
    }
    const billingStart = new Date(input.billingStart);
    const billingEnd = new Date(input.billingEnd);
    const dueDate = new Date(input.dueDate);
    if (billingEnd <= billingStart)
      throw new BadRequestException('Billing end must be after start');
    if (dueDate < billingStart)
      throw new BadRequestException('Due date cannot precede billing start');

    const packageSnapshot = {
      id: subscription.package.id,
      name: subscription.package.name,
      speedMbps: subscription.package.speedMbps,
      price: subscription.package.price.toString(),
      billingPeriod: subscription.package.billingPeriod,
    };
    try {
      return new InvoiceResponseDto(
        await this.invoices.create({
          number: input.invoiceNumber,
          customer: { connect: { id: subscription.customerId } },
          subscription: { connect: { id: subscription.id } },
          customerNameSnapshot: subscription.customer.name,
          customerPhoneSnapshot: subscription.customer.user.phone,
          packageNameSnapshot: subscription.package.name,
          packageSpeedSnapshot: subscription.package.speedMbps,
          amount: new Prisma.Decimal(input.amount),
          billingPeriod: subscription.package.billingPeriod,
          periodStart: billingStart,
          periodEnd: billingEnd,
          dueAt: dueDate,
          events: {
            create: {
              type: InvoiceEventType.GENERATED,
              actor: { connect: { id: actor.sub } },
              currentStatus: InvoiceStatus.GENERATED,
              metadata: {
                event: 'GENERATED',
                customerSnapshot: {
                  name: subscription.customer.name,
                  contact: subscription.customer.user.phone,
                },
                subscriptionId: subscription.id,
                packageSnapshot,
              },
            },
          },
        }),
      );
    } catch (error) {
      this.rethrowUniqueConflict(error);
    }
  }

  async getInvoiceById(id: string, actor: AuthUser) {
    const invoice = await this.findInvoice(id);
    this.assertCanView(invoice.customer.userId, actor);
    return new InvoiceResponseDto(invoice);
  }

  async getCustomerInvoices(customerId: string, actor: AuthUser) {
    const customer = await this.invoices.findCustomer(customerId);
    if (!customer) throw new NotFoundException('Customer not found');
    this.assertCanView(customer.userId, actor);
    const records = await this.invoices.findByCustomerId(customerId);
    return records.map(record => new InvoiceResponseDto(record));
  }

  async cancelInvoice(id: string, input: CancelInvoiceDto, actor: AuthUser) {
    this.assertAdmin(actor);
    return this.transition(
      id,
      InvoiceStatus.CANCELLED,
      InvoiceEventType.CANCELLED,
      input.reason,
      actor,
    );
  }

  async updateInvoiceStatus(
    id: string,
    input: UpdateInvoiceStatusDto,
    actor: AuthUser,
  ) {
    this.assertAdmin(actor);
    if (input.status === InvoiceStatus.PAID) {
      throw new ConflictException(
        'Paid status must be applied by a successful payment',
      );
    }
    return this.transition(
      id,
      input.status,
      input.status === InvoiceStatus.CANCELLED
        ? InvoiceEventType.CANCELLED
        : InvoiceEventType.STATUS_CHANGED,
      input.reason,
      actor,
    );
  }

  private async transition(
    id: string,
    status: InvoiceStatus,
    type: InvoiceEventType,
    reason: string | undefined,
    actor: AuthUser,
  ) {
    const invoice = await this.findInvoice(id);
    if (!TRANSITIONS[invoice.status].includes(status)) {
      throw new ConflictException(
        `Invoice cannot transition from ${invoice.status} to ${status}`,
      );
    }
    const updated = await this.invoices.transitionStatus({
      id,
      expectedStatus: invoice.status,
      status,
      type,
      actorId: actor.sub,
      cancelledAt: status === InvoiceStatus.CANCELLED ? new Date() : undefined,
      metadata: { event: type, reason },
    });
    if (!updated) throw new ConflictException('Invoice changed concurrently');
    return new InvoiceResponseDto(updated);
  }

  private async findInvoice(id: string) {
    const invoice = await this.invoices.findById(id);
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }
  private assertAdmin(actor: AuthUser) {
    if (actor.role !== Role.ADMIN)
      throw new ForbiddenException('Billing mutation denied');
  }
  private assertCanView(userId: string, actor: AuthUser) {
    if (actor.role !== Role.ADMIN && actor.sub !== userId)
      throw new ForbiddenException('Invoice access denied');
  }
  private rethrowUniqueConflict(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Invoice number already exists');
    }
    throw error;
  }
}
