import { Injectable } from '@nestjs/common';
import { InvoiceStatus, Prisma } from '@prisma/client';
import {
  AnalyticsResponseDto,
  InvoiceMetricDto,
} from './dto/analytics-response.dto';
import { ReportsRepository } from './reports.repository';

@Injectable()
export class ReportsService {
  constructor(private readonly reports: ReportsRepository) {}

  async getAnalytics() {
    const snapshot = await this.reports.getAnalyticsSnapshot();
    const metric = (status: InvoiceStatus) => {
      const row = snapshot.invoices.find(invoice => invoice.status === status);
      return new InvoiceMetricDto(
        row?._count._all ?? 0,
        row?._sum.amount?.toString() ?? '0',
      );
    };
    const paidInvoices = metric(InvoiceStatus.PAID);
    const pendingInvoices = metric(InvoiceStatus.PENDING);
    const overdueInvoices = metric(InvoiceStatus.OVERDUE);
    const cancelledInvoices = metric(InvoiceStatus.CANCELLED);
    const pending = new Prisma.Decimal(pendingInvoices.amount)
      .plus(overdueInvoices.amount)
      .toString();

    return new AnalyticsResponseDto({
      customers: snapshot.customers,
      activeConnections: snapshot.activeConnections,
      openComplaints: snapshot.openComplaints,
      revenue: paidInvoices.amount,
      pending,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      cancelledInvoices,
    });
  }
}
