import type { Role } from '@/types';

export type BackendRole = 'ADMIN' | 'CUSTOMER';
export type BackendUserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'DISABLED';

export type BackendSessionUser = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: BackendRole;
  status: BackendUserStatus;
  address: string | null;
  connectionId: string | null;
};

export type BackendAuthSession = {
  accessToken: string;
  refreshToken: string;
  user: BackendSessionUser;
};

export type BackendCurrentUser = BackendSessionUser & {
  cnic: string | null;
  installationDate: string | null;
  routerDetails: unknown;
  createdAt: string;
  updatedAt: string;
  subscriptions: unknown[];
};

export type SessionUser = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: Role;
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

export type OtpChallenge = {
  challengeId: string;
  developmentCode?: string;
};
