import type { Invoice } from '@/services/billing/models';
import type { CurrentPlan, ServiceAlert } from '@/services/network';
import type { CurrentPackageSnapshot } from '@/services/packages/models';
import type { Complaint } from '@/services/support/models';

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
}

export function dashboardPlan(
  current: CurrentPackageSnapshot | null,
): CurrentPlan | null {
  if (!current) return null;
  return {
    id: current.package.id,
    name: current.package.name,
    speedMbps: current.package.speed,
    monthlyPrice: current.package.price,
    billingCycle: current.package.billingCycle,
    expiryDate: formatDate(current.subscription.expiryDate),
    remainingDays: current.subscription.remainingDays,
  };
}

function currentPayableInvoice(invoices: Invoice[]): Invoice | undefined {
  return (
    invoices.find(invoice => invoice.status === 'overdue') ??
    invoices.find(invoice => invoice.status === 'pending')
  );
}

function currentComplaint(complaints: Complaint[]): Complaint | undefined {
  return complaints.find(complaint => complaint.status !== 'resolved');
}

export function dashboardAlerts(
  invoices: Invoice[],
  complaints: Complaint[],
): ServiceAlert[] {
  const alerts: ServiceAlert[] = [];
  const invoice = currentPayableInvoice(invoices);
  if (invoice) {
    const overdue = invoice.status === 'overdue';
    alerts.push({
      id: `invoice-${invoice.id}`,
      title: overdue ? 'Bill overdue' : 'Bill payment due',
      message: `Invoice ${invoice.invoiceNumber} for PKR ${invoice.amount.toLocaleString('en-PK')} is due ${formatDate(invoice.dueDate)}.`,
      tone: overdue ? 'danger' : 'warning',
      icon: 'receipt-outline',
    });
  }

  const complaint = currentComplaint(complaints);
  if (complaint) {
    alerts.push({
      id: `complaint-${complaint.id}`,
      title:
        complaint.status === 'submitted'
          ? 'Complaint submitted'
          : 'Complaint update',
      message: `${complaint.title} is currently ${complaint.status.replace('_', ' ')}.`,
      tone: 'info',
      icon: 'warning-outline',
    });
  }
  return alerts;
}
