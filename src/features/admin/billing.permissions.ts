export type BillingPermissions = {
  canViewBilling: boolean;
  canManagePayments: boolean;
  canCancelInvoice: boolean;
};

export const billingPermissions: BillingPermissions = {
  canViewBilling: true,
  canManagePayments: true,
  canCancelInvoice: true,
};
