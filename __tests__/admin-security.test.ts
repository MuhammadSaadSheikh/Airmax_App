import {
  AdminPermissionError,
  adminActionPermissions,
  canCreate,
  canDelete,
  canEdit,
  canManagePayments,
  canView,
  createAdminAuditEvent,
  createAdminConfirmation,
  createAdminPermissions,
  runProtectedAdminAction,
} from '@/features/admin/security';

describe('Phase 3H.1 admin security controls', () => {
  it('evaluates view, create, edit, delete and payment permissions', () => {
    const permissions = createAdminPermissions({
      view: ['billing', 'packages'],
      create: ['packages'],
      edit: ['packages'],
      delete: [],
      managePayments: false,
    });

    expect(canView('billing', permissions)).toBe(true);
    expect(canView('complaints', permissions)).toBe(false);
    expect(canCreate('packages', permissions)).toBe(true);
    expect(canEdit('packages', permissions)).toBe(true);
    expect(canDelete('packages', permissions)).toBe(false);
    expect(canManagePayments(permissions)).toBe(false);
  });

  it('maps every sensitive admin action to its required permission', () => {
    const restricted = createAdminPermissions({
      view: ['billing'],
      edit: [],
      delete: [],
      managePayments: false,
    });

    expect(adminActionPermissions.cancelInvoice(restricted)).toBe(false);
    expect(adminActionPermissions.managePayment(restricted)).toBe(false);
    expect(adminActionPermissions.deactivatePackage(restricted)).toBe(false);
    expect(adminActionPermissions.suspendSubscription(restricted)).toBe(false);
    expect(adminActionPermissions.cancelSubscription(restricted)).toBe(false);
    expect(adminActionPermissions.reassignComplaint(restricted)).toBe(false);
    expect(adminActionPermissions.changeWorkOrder(restricted)).toBe(false);
  });

  it('blocks protected actions before their mutation callback executes', () => {
    const action = jest.fn(() => 'completed');

    expect(() =>
      runProtectedAdminAction(false, 'cancel invoice', 'billing', action),
    ).toThrow(AdminPermissionError);
    expect(action).not.toHaveBeenCalled();

    expect(
      runProtectedAdminAction(true, 'cancel invoice', 'billing', action),
    ).toBe('completed');
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('creates confirmation state with cancel and confirm options', () => {
    const onConfirm = jest.fn();
    const confirmation = createAdminConfirmation({
      actionName: 'Deactivate package',
      affectedEntity: 'Premium package (premium)',
      confirmLabel: 'Deactivate',
      onConfirm,
    });

    expect(confirmation.title).toBe('Deactivate package');
    expect(confirmation.message).toContain('Premium package (premium)');
    expect(confirmation.buttons[0]).toMatchObject({
      text: 'Cancel',
      style: 'cancel',
    });
    expect(confirmation.buttons[1]).toMatchObject({
      text: 'Deactivate',
      style: 'destructive',
    });
    confirmation.buttons[1].onPress?.();
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('prepares immutable audit event data without persistence', () => {
    const metadata = { previousStatus: 'active', destructive: true };
    const event = createAdminAuditEvent(
      {
        actorId: 'admin-1',
        actorName: 'Admin One',
        action: 'PACKAGE_DEACTIVATED',
        entityType: 'PACKAGE',
        entityId: 'premium',
        metadata,
      },
      () => '2026-08-22T10:00:00.000Z',
    );
    metadata.previousStatus = 'changed';

    expect(event).toEqual({
      id: 'audit:admin-1:PACKAGE_DEACTIVATED:PACKAGE:premium:2026-08-22T10:00:00.000Z',
      actorId: 'admin-1',
      actorName: 'Admin One',
      action: 'PACKAGE_DEACTIVATED',
      entityType: 'PACKAGE',
      entityId: 'premium',
      timestamp: '2026-08-22T10:00:00.000Z',
      metadata: { previousStatus: 'active', destructive: true },
    });
  });
});
