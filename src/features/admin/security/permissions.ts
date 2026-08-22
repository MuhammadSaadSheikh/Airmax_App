export type AdminResource =
  | 'customers'
  | 'billing'
  | 'packages'
  | 'subscriptions'
  | 'complaints'
  | 'technicians'
  | 'reports'
  | 'audit';

export type AdminSecurityRole =
  'SUPER_ADMIN' | 'ADMIN' | 'FINANCE' | 'SUPPORT' | 'TECHNICIAN_MANAGER';

export type AdminPermissionSet = {
  view: readonly AdminResource[];
  create: readonly AdminResource[];
  edit: readonly AdminResource[];
  delete: readonly AdminResource[];
  managePayments: boolean;
};

const resources: readonly AdminResource[] = [
  'customers',
  'billing',
  'packages',
  'subscriptions',
  'complaints',
  'technicians',
  'reports',
  'audit',
];

export const defaultAdminPermissions: AdminPermissionSet = {
  view: resources,
  create: resources,
  edit: resources,
  delete: resources,
  managePayments: true,
};

export function createAdminPermissions(
  overrides: Partial<AdminPermissionSet> = {},
): AdminPermissionSet {
  return {
    view: [...(overrides.view ?? defaultAdminPermissions.view)],
    create: [...(overrides.create ?? defaultAdminPermissions.create)],
    edit: [...(overrides.edit ?? defaultAdminPermissions.edit)],
    delete: [...(overrides.delete ?? defaultAdminPermissions.delete)],
    managePayments:
      overrides.managePayments ?? defaultAdminPermissions.managePayments,
  };
}

export function canView(
  resource: AdminResource,
  permissions = defaultAdminPermissions,
): boolean {
  return permissions.view.includes(resource);
}

export function canCreate(
  resource: AdminResource,
  permissions = defaultAdminPermissions,
): boolean {
  return permissions.create.includes(resource);
}

export function canEdit(
  resource: AdminResource,
  permissions = defaultAdminPermissions,
): boolean {
  return permissions.edit.includes(resource);
}

export function canDelete(
  resource: AdminResource,
  permissions = defaultAdminPermissions,
): boolean {
  return permissions.delete.includes(resource);
}

export function canManagePayments(
  permissions = defaultAdminPermissions,
): boolean {
  return permissions.managePayments && canView('billing', permissions);
}

const roleResources: Record<
  AdminSecurityRole,
  {
    view: readonly AdminResource[];
    create: readonly AdminResource[];
    edit: readonly AdminResource[];
    delete: readonly AdminResource[];
    managePayments: boolean;
  }
> = {
  SUPER_ADMIN: {
    view: resources,
    create: resources,
    edit: resources,
    delete: resources,
    managePayments: true,
  },
  ADMIN: {
    view: resources,
    create: ['customers', 'packages', 'subscriptions', 'complaints'],
    edit: [
      'customers',
      'packages',
      'subscriptions',
      'billing',
      'complaints',
      'technicians',
    ],
    delete: ['packages', 'subscriptions', 'billing'],
    managePayments: true,
  },
  FINANCE: {
    view: ['customers', 'subscriptions', 'billing', 'reports', 'audit'],
    create: ['billing'],
    edit: ['billing'],
    delete: ['billing'],
    managePayments: true,
  },
  SUPPORT: {
    view: ['customers', 'complaints', 'technicians', 'reports', 'audit'],
    create: ['complaints'],
    edit: ['complaints'],
    delete: [],
    managePayments: false,
  },
  TECHNICIAN_MANAGER: {
    view: ['customers', 'complaints', 'technicians', 'reports', 'audit'],
    create: ['technicians'],
    edit: ['complaints', 'technicians'],
    delete: [],
    managePayments: false,
  },
};

export function createAdminPermissionsForRole(
  role: AdminSecurityRole,
): AdminPermissionSet {
  return createAdminPermissions(roleResources[role]);
}

export const adminActionPermissions = {
  createCustomer: (permissions = defaultAdminPermissions) =>
    canCreate('customers', permissions),
  editCustomer: (permissions = defaultAdminPermissions) =>
    canEdit('customers', permissions),
  changeCustomerStatus: (permissions = defaultAdminPermissions) =>
    canEdit('customers', permissions),
  changeCustomerPackage: (permissions = defaultAdminPermissions) =>
    canEdit('subscriptions', permissions),
  createPackage: (permissions = defaultAdminPermissions) =>
    canCreate('packages', permissions),
  editPackage: (permissions = defaultAdminPermissions) =>
    canEdit('packages', permissions),
  activatePackage: (permissions = defaultAdminPermissions) =>
    canEdit('packages', permissions),
  cancelInvoice: (permissions = defaultAdminPermissions) =>
    canDelete('billing', permissions),
  managePayment: (permissions = defaultAdminPermissions) =>
    canManagePayments(permissions),
  markInvoicePaid: (permissions = defaultAdminPermissions) =>
    canManagePayments(permissions),
  deactivatePackage: (permissions = defaultAdminPermissions) =>
    canDelete('packages', permissions),
  suspendSubscription: (permissions = defaultAdminPermissions) =>
    canEdit('subscriptions', permissions),
  activateSubscription: (permissions = defaultAdminPermissions) =>
    canEdit('subscriptions', permissions),
  cancelSubscription: (permissions = defaultAdminPermissions) =>
    canDelete('subscriptions', permissions),
  reassignComplaint: (permissions = defaultAdminPermissions) =>
    canEdit('complaints', permissions),
  assignComplaint: (permissions = defaultAdminPermissions) =>
    canEdit('complaints', permissions),
  changeComplaintStatus: (permissions = defaultAdminPermissions) =>
    canEdit('complaints', permissions),
  replyToComplaint: (permissions = defaultAdminPermissions) =>
    canEdit('complaints', permissions),
  changeTechnicianStatus: (permissions = defaultAdminPermissions) =>
    canEdit('technicians', permissions),
  changeWorkOrder: (permissions = defaultAdminPermissions) =>
    canEdit('technicians', permissions),
  viewReports: (permissions = defaultAdminPermissions) =>
    canView('reports', permissions),
  exportReports: (permissions = defaultAdminPermissions) =>
    canView('reports', permissions),
  viewAudit: (permissions = defaultAdminPermissions) =>
    canView('audit', permissions),
};
