import { Prisma, type Role, type UserStatus } from '@prisma/client';

export const sessionUserSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  role: true,
  status: true,
  address: true,
  connectionId: true,
} satisfies Prisma.UserSelect;

export type SessionUserRecord = Prisma.UserGetPayload<{
  select: typeof sessionUserSelect;
}>;

export class SessionUserResponseDto {
  readonly id: string;
  readonly name: string;
  readonly phone: string;
  readonly email: string | null;
  readonly role: Role;
  readonly status: UserStatus;
  readonly address: string | null;
  readonly connectionId: string | null;

  constructor(user: SessionUserRecord) {
    this.id = user.id;
    this.name = user.name;
    this.phone = user.phone;
    this.email = user.email;
    this.role = user.role;
    this.status = user.status;
    this.address = user.address;
    this.connectionId = user.connectionId;
  }
}

export const userDetailSelect = {
  ...sessionUserSelect,
  cnic: true,
  installationDate: true,
  routerDetails: true,
  createdAt: true,
  updatedAt: true,
  subscriptions: {
    include: { package: true },
    orderBy: { createdAt: 'desc' as const },
    take: 1,
  },
} satisfies Prisma.UserSelect;

export type UserDetailRecord = Prisma.UserGetPayload<{
  select: typeof userDetailSelect;
}>;

export class UserDetailResponseDto extends SessionUserResponseDto {
  readonly cnic: string | null;
  readonly installationDate: Date | null;
  readonly routerDetails: Prisma.JsonValue | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly subscriptions: UserDetailRecord['subscriptions'];

  constructor(user: UserDetailRecord) {
    super(user);
    this.cnic = user.cnic;
    this.installationDate = user.installationDate;
    this.routerDetails = user.routerDetails;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
    this.subscriptions = user.subscriptions;
  }
}
