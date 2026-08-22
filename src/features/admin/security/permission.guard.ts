import type { AlertButton } from 'react-native';
import type { AdminResource } from './permissions';

export class AdminPermissionError extends Error {
  constructor(
    public readonly action: string,
    public readonly resource: AdminResource,
  ) {
    super(`Admin permission denied: ${action} ${resource}`);
    this.name = 'AdminPermissionError';
  }
}

export function guardAdminPermission(
  allowed: boolean,
  action: string,
  resource: AdminResource,
): void {
  if (!allowed) throw new AdminPermissionError(action, resource);
}

export function runProtectedAdminAction<T>(
  allowed: boolean,
  action: string,
  resource: AdminResource,
  execute: () => T,
): T {
  guardAdminPermission(allowed, action, resource);
  return execute();
}

export type AdminConfirmationState = {
  title: string;
  message: string;
  buttons: [AlertButton, AlertButton];
};

export function createAdminConfirmation({
  actionName,
  affectedEntity,
  confirmLabel = 'Confirm',
  destructive = true,
  onConfirm,
}: {
  actionName: string;
  affectedEntity: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}): AdminConfirmationState {
  return {
    title: actionName,
    message: `${actionName} will affect ${affectedEntity}. Continue?`,
    buttons: [
      { text: 'Cancel', style: 'cancel' },
      {
        text: confirmLabel,
        style: destructive ? 'destructive' : 'default',
        onPress: onConfirm,
      },
    ],
  };
}
