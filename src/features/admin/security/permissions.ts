export type AdminResource =
  'billing' | 'packages' | 'subscriptions' | 'complaints' | 'technicians';

export type AdminPermissionSet = {
  view: readonly AdminResource[];
  create: readonly AdminResource[];
  edit: readonly AdminResource[];
  delete: readonly AdminResource[];
  managePayments: boolean;
};

const resources: readonly AdminResource[] = [
  'billing',
  'packages',
  'subscriptions',
  'complaints',
  'technicians',
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

export const adminActionPermissions = {
  cancelInvoice: (permissions = defaultAdminPermissions) =>
    canDelete('billing', permissions),
  managePayment: (permissions = defaultAdminPermissions) =>
    canManagePayments(permissions),
  deactivatePackage: (permissions = defaultAdminPermissions) =>
    canDelete('packages', permissions),
  suspendSubscription: (permissions = defaultAdminPermissions) =>
    canEdit('subscriptions', permissions),
  cancelSubscription: (permissions = defaultAdminPermissions) =>
    canDelete('subscriptions', permissions),
  reassignComplaint: (permissions = defaultAdminPermissions) =>
    canEdit('complaints', permissions),
  changeWorkOrder: (permissions = defaultAdminPermissions) =>
    canEdit('technicians', permissions),
};
