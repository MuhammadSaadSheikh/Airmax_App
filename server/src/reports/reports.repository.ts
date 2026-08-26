import { Injectable } from '@nestjs/common';
import {
  ComplaintStatus,
  InvoiceStatus,
  SubscriptionStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAnalyticsSnapshot() {
    const [customers, activeConnections, openComplaints, invoices] =
      await Promise.all([
        this.prisma.customer.count(),
        this.prisma.subscription.count({
          where: { status: SubscriptionStatus.ACTIVE },
        }),
        this.prisma.complaint.count({
          where: {
            status: {
              notIn: [ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED],
            },
          },
        }),
        this.prisma.invoice.groupBy({
          by: ['status'],
          where: {
            status: {
              in: [
                InvoiceStatus.PAID,
                InvoiceStatus.PENDING,
                InvoiceStatus.OVERDUE,
                InvoiceStatus.CANCELLED,
              ],
            },
          },
          _count: { _all: true },
          _sum: { amount: true },
        }),
      ]);
    return { customers, activeConnections, openComplaints, invoices };
  }
}
