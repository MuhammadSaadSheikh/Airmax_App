import type { InvoiceDto, PaymentDto } from './billing.models';
import type { ComplaintDto } from './complaints.models';
import type { CustomerDetailDto } from './customers.models';
import type { PackageDto } from './packages.models';
import type { SubscriptionDto } from './subscriptions.models';
import { mockBillingRepository } from './billing.mock.repository';
import { mockComplaintRepository } from './complaints.mock.repository';
import { mockCustomerRepository } from './customers.mock.repository';
import { mockPackageRepository } from './packages.mock.repository';
import { mockSubscriptionRepository } from './subscriptions.mock.repository';

export type MockSystemSnapshot = {
  customers: CustomerDetailDto[];
  packages: PackageDto[];
  subscriptions: SubscriptionDto[];
  invoices: InvoiceDto[];
  payments: PaymentDto[];
  complaints: ComplaintDto[];
};

export function readMockSystemSnapshot(): MockSystemSnapshot {
  return {
    customers: mockCustomerRepository.list(),
    packages: mockPackageRepository.list(),
    subscriptions: mockSubscriptionRepository.list(),
    invoices: mockBillingRepository.listInvoices(),
    payments: mockBillingRepository.listPayments(),
    complaints: mockComplaintRepository.list(),
  };
}

const complaintFlow = [
  'PENDING',
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
] as const;

export function validateMockSystem(
  snapshot: MockSystemSnapshot = readMockSystemSnapshot(),
): void {
  const customerIds = new Set(snapshot.customers.map(customer => customer.id));
  const packageIds = new Set(
    snapshot.packages.map(packageItem => packageItem.id),
  );
  const subscriptionIds = new Set(
    snapshot.subscriptions.map(subscription => subscription.id),
  );
  const invoiceIds = new Set(snapshot.invoices.map(invoice => invoice.id));
  const errors: string[] = [];

  snapshot.subscriptions.forEach(subscription => {
    if (!customerIds.has(subscription.userId)) {
      errors.push(
        `Subscription ${subscription.id} references missing customer`,
      );
    }
    if (!packageIds.has(subscription.packageId)) {
      errors.push(`Subscription ${subscription.id} references missing package`);
    }
    if (subscription.customer.id !== subscription.userId) {
      errors.push(
        `Subscription ${subscription.id} customer snapshot is inconsistent`,
      );
    }
    if (subscription.package.id !== subscription.packageId) {
      errors.push(
        `Subscription ${subscription.id} package snapshot is inconsistent`,
      );
    }
  });

  snapshot.invoices.forEach(invoice => {
    if (!customerIds.has(invoice.customerId)) {
      errors.push(`Invoice ${invoice.id} references missing customer`);
    }
    if (!subscriptionIds.has(invoice.subscriptionId)) {
      errors.push(`Invoice ${invoice.id} references missing subscription`);
    }
    if (invoice.customer.id !== invoice.customerId) {
      errors.push(`Invoice ${invoice.id} customer snapshot is inconsistent`);
    }
    if (invoice.subscription.id !== invoice.subscriptionId) {
      errors.push(
        `Invoice ${invoice.id} subscription snapshot is inconsistent`,
      );
    }
  });

  snapshot.payments.forEach(payment => {
    if (!invoiceIds.has(payment.invoiceId)) {
      errors.push(`Payment ${payment.id} references missing invoice`);
    }
    if (!payment.reference.trim()) {
      errors.push(`Payment ${payment.id} has no reference`);
    }
    if (!payment.actorId.trim()) {
      errors.push(`Payment ${payment.id} has no actor`);
    }
  });

  snapshot.complaints.forEach(complaint => {
    if (!customerIds.has(complaint.userId)) {
      errors.push(`Complaint ${complaint.id} references missing customer`);
    }
    let previousIndex = -1;
    complaint.events.forEach(event => {
      const index = complaintFlow.indexOf(event.status);
      if (index < previousIndex || index > previousIndex + 1) {
        errors.push(`Complaint ${complaint.id} has an invalid timeline`);
      }
      previousIndex = Math.max(previousIndex, index);
    });
    if (complaintFlow[previousIndex] !== complaint.status) {
      errors.push(
        `Complaint ${complaint.id} status does not match its timeline`,
      );
    }
  });

  if (errors.length > 0) {
    throw new Error(`Mock fixture integrity failed:\n${errors.join('\n')}`);
  }
}

export const mockSystemRepository = {
  reset(): void {
    mockPackageRepository.reset();
    mockSubscriptionRepository.reset();
    mockCustomerRepository.reset();
    mockBillingRepository.reset();
    mockComplaintRepository.reset();
    validateMockSystem();
  },

  validate: validateMockSystem,
  snapshot: readMockSystemSnapshot,
};
