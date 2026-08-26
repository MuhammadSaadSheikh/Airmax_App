import type { Role } from '@/types';

export type BackendAdminRole =
  'SUPER_ADMIN' | 'ADMIN' | 'FINANCE' | 'SUPPORT' | 'TECHNICIAN_MANAGER';
export type BackendRole = BackendAdminRole | 'CUSTOMER';
export type BackendUserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'DISABLED';

export type BackendSessionUser = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: BackendRole;
  status: BackendUserStatus;
  address?: string | null;
  connectionId?: string | null;
};

export type BackendAuthSession = {
  accessToken: string;
  refreshToken: string;
  user: BackendSessionUser;
};

export type BackendRegistrationResponse = {
  user: BackendSessionUser;
};

export type BackendCurrentUser = BackendSessionUser & {
  cnic?: string | null;
  installationDate?: string | null;
  routerDetails?: unknown;
  createdAt: string;
  updatedAt: string;
  subscriptions?: unknown[];
};

export type SessionUser = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: Role;
  /** Preserves granular backend authorization without changing portal routing. */
  adminRole?: BackendAdminRole;
  status: 'active' | 'suspended' | 'pending' | 'disabled';
  address?: string;
  connectionId?: string;
};

export type CurrentUser = SessionUser & {
  cnic?: string;
  installationDate?: string;
  router?: string;
  createdAt: string;
  updatedAt: string;
  subscriptions: unknown[];
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
};

export type LoginInput = {
  identifier: string;
  password: string;
  mockRole?: Role;
};

export type RegisterInput = {
  name: string;
  phone: string;
  email?: string;
  password: string;
};

export type RegistrationResult = {
  user: SessionUser;
};

export type OtpChallenge = {
  challengeId: string;
};

export type AuthOperation =
  | 'login'
  | 'register'
  | 'requestOtp'
  | 'verifyOtp'
  | 'refresh'
  | 'logout'
  | 'currentUser';
