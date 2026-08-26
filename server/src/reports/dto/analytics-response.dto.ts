export class InvoiceMetricDto {
  readonly count: number;
  readonly amount: string;

  constructor(count: number, amount: string) {
    this.count = count;
    this.amount = amount;
  }
}

export class AnalyticsResponseDto {
  readonly customers: number;
  readonly activeConnections: number;
  readonly openComplaints: number;
  readonly revenue: string;
  readonly pending: string;
  readonly paidInvoices: InvoiceMetricDto;
  readonly pendingInvoices: InvoiceMetricDto;
  readonly overdueInvoices: InvoiceMetricDto;
  readonly cancelledInvoices: InvoiceMetricDto;

  constructor(input: {
    customers: number;
    activeConnections: number;
    openComplaints: number;
    revenue: string;
    pending: string;
    paidInvoices: InvoiceMetricDto;
    pendingInvoices: InvoiceMetricDto;
    overdueInvoices: InvoiceMetricDto;
    cancelledInvoices: InvoiceMetricDto;
  }) {
    this.customers = input.customers;
    this.activeConnections = input.activeConnections;
    this.openComplaints = input.openComplaints;
    this.revenue = input.revenue;
    this.pending = input.pending;
    this.paidInvoices = input.paidInvoices;
    this.pendingInvoices = input.pendingInvoices;
    this.overdueInvoices = input.overdueInvoices;
    this.cancelledInvoices = input.cancelledInvoices;
  }
}
