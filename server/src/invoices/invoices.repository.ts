import { Injectable } from '@nestjs/common';
import { InvoiceEventType, InvoiceStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { invoiceInclude } from './dto/invoice.dto';

@Injectable()
export class InvoicesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findSubscription(id: string) {
    return this.prisma.subscription.findUnique({
      where: { id },
      include: {
        customer: { include: { user: { select: { phone: true } } } },
        package: true,
      },
    });
  }
  findCustomer(id: string) {
    return this.prisma.customer.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });
  }
  findById(id: string) {
    return this.prisma.invoice.findUnique({
      where: { id },
      include: invoiceInclude,
    });
  }
  findByCustomerId(customerId: string) {
    return this.prisma.invoice.findMany({
      where: { customerId },
      include: invoiceInclude,
      orderBy: { createdAt: 'desc' },
    });
  }
  create(data: Prisma.InvoiceCreateInput) {
    return this.prisma.invoice.create({ data, include: invoiceInclude });
  }

  async transitionStatus(input: {
    id: string;
    expectedStatus: InvoiceStatus;
    status: InvoiceStatus;
    type: InvoiceEventType;
    actorId: string;
    metadata?: Prisma.InputJsonValue;
    paidAt?: Date;
    cancelledAt?: Date;
  }) {
    return this.prisma.$transaction(async transaction => {
      const changed = await transaction.invoice.updateMany({
        where: { id: input.id, status: input.expectedStatus },
        data: {
          status: input.status,
          paidAt: input.paidAt,
          cancelledAt: input.cancelledAt,
        },
      });
      if (changed.count !== 1) return null;
      await transaction.invoiceEvent.create({
        data: {
          invoiceId: input.id,
          type: input.type,
          actorId: input.actorId,
          previousStatus: input.expectedStatus,
          currentStatus: input.status,
          metadata: input.metadata,
        },
      });
      return transaction.invoice.findUniqueOrThrow({
        where: { id: input.id },
        include: invoiceInclude,
      });
    });
  }
}
