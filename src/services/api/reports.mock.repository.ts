import type { InvoiceDto, PaymentDto } from './billing.models';
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
import { mockBillingRepository } from './billing.mock.repository';
import { mockComplaintRepository } from './complaints.mock.repository';
import { mockCustomerRepository } from './customers.mock.repository';
import { mockPackageRepository } from './packages.mock.repository';
import { mockSubscriptionRepository } from './subscriptions.mock.repository';
import { mockTechnicianRepository } from './technicians.mock.repository';

export type MockReportingSnapshot = {
  packages: PackageDto[];
  assignments: TechnicianAssignmentDto[];
  technicianHistory: TechnicianHistory[];
  customers: CustomerDetailDto[];
  subscriptions: SubscriptionDto[];
  invoices: InvoiceDto[];
  payments: PaymentDto[];
  complaints: ComplaintDto[];
  technicians: TechnicianDto[];
  workOrders: TechnicianWorkOrderDto[];
};

export type ReportsSnapshotRepository = {
  snapshot(): MockReportingSnapshot;
};

export const mockReportsRepository: ReportsSnapshotRepository = {
  snapshot(): MockReportingSnapshot {
    const technicianSnapshot = mockTechnicianRepository.snapshot();
    return {
      customers: mockCustomerRepository.list(),
      subscriptions: mockSubscriptionRepository.list(),
      packages: mockPackageRepository.list(),
      invoices: mockBillingRepository.listInvoices(),
      payments: mockBillingRepository.listPayments(),
      complaints: mockComplaintRepository.list(),
      technicians: technicianSnapshot.technicians,
      assignments: technicianSnapshot.assignments,
      workOrders: technicianSnapshot.workOrders,
      technicianHistory: technicianSnapshot.history,
    };
  },
};
