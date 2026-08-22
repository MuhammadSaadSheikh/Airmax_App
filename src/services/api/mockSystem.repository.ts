import type { InvoiceDto, PaymentDto } from './billing.models';
import type { AuditEventDto } from './audit.models';
import type { ComplaintDto } from './complaints.models';
import type { CustomerDetailDto } from './customers.models';
import type { PackageDto } from './packages.models';
import type { SubscriptionDto } from './subscriptions.models';
import type {
  TechnicianAssignmentDto,
  TechnicianDto,
  TechnicianHistory,
  TechnicianWorkOrderDto,
} from './technicians.models';
import { mockAuditRepository } from './audit.mock.repository';
import { mockBillingRepository } from './billing.mock.repository';
import { mockComplaintRepository } from './complaints.mock.repository';
import { mockCustomerRepository } from './customers.mock.repository';
import { mockPackageRepository } from './packages.mock.repository';
import { mockSubscriptionRepository } from './subscriptions.mock.repository';
import { mockTechnicianRepository } from './technicians.mock.repository';

export type MockSystemSnapshot = {
  customers: CustomerDetailDto[];
  packages: PackageDto[];
  subscriptions: SubscriptionDto[];
  invoices: InvoiceDto[];
  payments: PaymentDto[];
  complaints: ComplaintDto[];
  technicians: TechnicianDto[];
  assignments: TechnicianAssignmentDto[];
  workOrders: TechnicianWorkOrderDto[];
  technicianHistory: TechnicianHistory[];
  auditEvents: AuditEventDto[];
};

export function readMockSystemSnapshot(): MockSystemSnapshot {
  const fieldService = mockTechnicianRepository.snapshot();
  return {
    customers: mockCustomerRepository.list(),
    packages: mockPackageRepository.list(),
    subscriptions: mockSubscriptionRepository.list(),
    invoices: mockBillingRepository.listInvoices(),
    payments: mockBillingRepository.listPayments(),
    complaints: mockComplaintRepository.list(),
    technicians: fieldService.technicians,
    assignments: fieldService.assignments,
    workOrders: fieldService.workOrders,
    technicianHistory: fieldService.history,
    auditEvents: mockAuditRepository.list(),
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
  const paymentIds = new Set(snapshot.payments.map(payment => payment.id));
  const complaintIds = new Set(
    snapshot.complaints.map(complaint => complaint.id),
  );
  const technicianIds = new Set(
    snapshot.technicians.map(technician => technician.id),
  );
  const assignmentIds = new Set(
    snapshot.assignments.map(assignment => assignment.id),
  );
  const workOrderIds = new Set(
    snapshot.workOrders.map(workOrder => workOrder.id),
  );
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
    if (complaint.technicianId && !technicianIds.has(complaint.technicianId)) {
      errors.push(`Complaint ${complaint.id} references missing technician`);
    }
  });

  snapshot.assignments.forEach(assignment => {
    const workOrder = snapshot.workOrders.find(
      item => item.id === assignment.workOrderId,
    );
    if (!technicianIds.has(assignment.technicianId)) {
      errors.push(`Assignment ${assignment.id} references missing technician`);
    }
    if (!complaintIds.has(assignment.complaintId)) {
      errors.push(`Assignment ${assignment.id} references missing complaint`);
    }
    if (!workOrder) {
      errors.push(`Assignment ${assignment.id} references missing work order`);
    } else if (
      workOrder.assignmentId !== assignment.id ||
      workOrder.technicianId !== assignment.technicianId ||
      workOrder.complaintId !== assignment.complaintId
    ) {
      errors.push(`Assignment ${assignment.id} relationship is inconsistent`);
    }
  });

  const activeWorkOrderStatuses = new Set([
    'ASSIGNED',
    'ACCEPTED',
    'IN_PROGRESS',
  ]);
  snapshot.workOrders.forEach(workOrder => {
    if (!assignmentIds.has(workOrder.assignmentId)) {
      errors.push(`Work order ${workOrder.id} references missing assignment`);
    }
    if (!complaintIds.has(workOrder.complaintId)) {
      errors.push(`Work order ${workOrder.id} references missing complaint`);
    }
    if (!technicianIds.has(workOrder.technicianId)) {
      errors.push(`Work order ${workOrder.id} references missing technician`);
    }
  });
  snapshot.complaints
    .filter(complaint => ['ASSIGNED', 'IN_PROGRESS'].includes(complaint.status))
    .forEach(complaint => {
      const workOrder = snapshot.workOrders.find(
        item =>
          item.complaintId === complaint.id &&
          activeWorkOrderStatuses.has(item.status),
      );
      if (!workOrder || workOrder.technicianId !== complaint.technicianId) {
        errors.push(
          `Complaint ${complaint.id} has no consistent active work order`,
        );
      }
    });
  snapshot.technicians.forEach(technician => {
    const activeJobs = snapshot.workOrders.filter(
      workOrder =>
        workOrder.technicianId === technician.id &&
        activeWorkOrderStatuses.has(workOrder.status),
    ).length;
    if (activeJobs > technician.capacity) {
      errors.push(`Technician ${technician.id} exceeds capacity`);
    }
  });
  snapshot.technicianHistory.forEach(history => {
    if (!technicianIds.has(history.technicianId)) {
      errors.push(`Technician history ${history.id} has missing technician`);
    }
    if (history.workOrderId && !workOrderIds.has(history.workOrderId)) {
      errors.push(`Technician history ${history.id} has missing work order`);
    }
  });

  snapshot.auditEvents.forEach(event => {
    const validEntity =
      (event.entityType === 'CUSTOMER' && customerIds.has(event.entityId)) ||
      (event.entityType === 'PACKAGE' && packageIds.has(event.entityId)) ||
      (event.entityType === 'SUBSCRIPTION' &&
        subscriptionIds.has(event.entityId)) ||
      (event.entityType === 'INVOICE' && invoiceIds.has(event.entityId)) ||
      (event.entityType === 'PAYMENT' && paymentIds.has(event.entityId)) ||
      (event.entityType === 'COMPLAINT' && complaintIds.has(event.entityId)) ||
      (event.entityType === 'TECHNICIAN' &&
        technicianIds.has(event.entityId)) ||
      (event.entityType === 'WORK_ORDER' && workOrderIds.has(event.entityId));
    if (!validEntity) {
      errors.push(`Audit event ${event.id} references missing entity`);
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
    mockTechnicianRepository.reset();
    mockAuditRepository.reset();
    validateMockSystem();
  },

  validate: validateMockSystem,
  snapshot: readMockSystemSnapshot,
};
