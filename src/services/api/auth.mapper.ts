import type {
  AuthSession,
  BackendAuthSession,
  BackendCurrentUser,
  BackendRole,
  BackendSessionUser,
  CurrentUser,
  SessionUser,
} from './auth.models';
import type { Role } from '@/types';
import { AuthenticationError } from './errors';

export class AuthContractError extends AuthenticationError {
  constructor(message: string) {
    super(message, 401);
    this.name = 'AuthContractError';
  }
}

export function mapBackendRole(role: BackendRole | string): Role {
  switch (role) {
    case 'ADMIN':
      return 'admin';
    case 'CUSTOMER':
      return 'customer';
    default:
      throw new AuthContractError(`Unsupported backend role: ${role}`);
  }
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new AuthContractError(`Invalid authentication field: ${field}`);
  }
  return value;
}

function optionalString(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return requiredString(value, field);
}

function mapStatus(status: BackendSessionUser['status'] | string) {
  switch (status) {
    case 'ACTIVE':
      return 'active' as const;
    case 'SUSPENDED':
      return 'suspended' as const;
    case 'PENDING':
      return 'pending' as const;
    case 'DISABLED':
      return 'disabled' as const;
    default:
      throw new AuthContractError(`Unsupported account status: ${status}`);
  }
}

export function mapSessionUser(user: BackendSessionUser): SessionUser {
  if (!user || typeof user !== 'object') {
    throw new AuthContractError('Authentication response is missing a user');
  }
  return {
    id: requiredString(user.id, 'user.id'),
    name: requiredString(user.name, 'user.name'),
    phone: requiredString(user.phone, 'user.phone'),
    email: optionalString(user.email, 'user.email'),
    role: mapBackendRole(user.role),
    status: mapStatus(user.status),
    address: optionalString(user.address, 'user.address'),
    connectionId: optionalString(user.connectionId, 'user.connectionId'),
  };
}

export function mapAuthSession(response: BackendAuthSession): AuthSession {
  if (!response || typeof response !== 'object') {
    throw new AuthContractError('Invalid authentication response');
  }
  return {
    accessToken: requiredString(response.accessToken, 'accessToken'),
    refreshToken: requiredString(response.refreshToken, 'refreshToken'),
    user: mapSessionUser(response.user),
  };
}

function routerLabel(value: unknown): string | undefined {
  if (typeof value === 'string' && value.length > 0) return value;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  const details = value as Record<string, unknown>;
  return optionalString(
    details.model ?? details.name ?? details.serialNumber,
    'user.routerDetails',
  );
}

export function mapCurrentUser(user: BackendCurrentUser): CurrentUser {
  const sessionUser = mapSessionUser(user);
  return {
    ...sessionUser,
    cnic: optionalString(user.cnic, 'user.cnic'),
    installationDate: optionalString(
      user.installationDate,
      'user.installationDate',
    ),
    router: routerLabel(user.routerDetails),
    createdAt: requiredString(user.createdAt, 'user.createdAt'),
    updatedAt: requiredString(user.updatedAt, 'user.updatedAt'),
    subscriptions: Array.isArray(user.subscriptions) ? user.subscriptions : [],
  };
}
