import type { Role } from '@/types';
import { AuthenticationError, ValidationError } from '../errors';
import type {
  AuthSession,
  BackendAdminRole,
  BackendAuthSession,
  BackendCurrentUser,
  BackendRegistrationResponse,
  BackendRole,
  BackendSessionUser,
  CurrentUser,
  OtpChallenge,
  RegistrationResult,
  SessionUser,
} from './auth.models';

export class AuthContractError extends AuthenticationError {
  constructor(message: string) {
    super(message, 401);
    this.name = 'AuthContractError';
  }
}

export function mapBackendRole(role: BackendRole | string): Role {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
    case 'FINANCE':
    case 'SUPPORT':
    case 'TECHNICIAN_MANAGER':
      return 'admin';
    case 'CUSTOMER':
      return 'customer';
    default:
      throw new AuthContractError(`Unsupported backend role: ${role}`);
  }
}

function mapAdminRole(role: BackendRole): BackendAdminRole | undefined {
  return role === 'CUSTOMER' ? undefined : role;
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
    adminRole: mapAdminRole(user.role),
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

export function mapRegistration(
  response: BackendRegistrationResponse,
): RegistrationResult {
  if (!response || typeof response !== 'object') {
    throw new AuthContractError('Invalid registration response');
  }
  return { user: mapSessionUser(response.user) };
}

export function mapOtpChallenge(value: unknown): OtpChallenge {
  const challengeId = (value as { challengeId?: unknown } | null)?.challengeId;
  if (typeof challengeId !== 'string' || challengeId.length === 0) {
    throw new ValidationError('Unable to start verification.', 502);
  }
  return { challengeId };
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
