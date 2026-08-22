import { adminActionPermissions, canView } from '@/features/admin/security';

export type BillingPermissions = {
  canViewBilling: boolean;
  canManagePayments: boolean;
  canCancelInvoice: boolean;
};

export const billingPermissions: BillingPermissions = {
  canViewBilling: canView('billing'),
  canManagePayments: adminActionPermissions.managePayment(),
  canCancelInvoice: adminActionPermissions.cancelInvoice(),
};
