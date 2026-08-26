import { Prisma, type Role, type UserStatus } from '@prisma/client';

export const sessionUserSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  role: true,
  status: true,
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

  constructor(user: SessionUserRecord) {
    this.id = user.id;
    this.name = user.name;
    this.phone = user.phone;
    this.email = user.email;
    this.role = user.role;
    this.status = user.status;
  }
}

export const userDetailSelect = {
  ...sessionUserSelect,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export type UserDetailRecord = Prisma.UserGetPayload<{
  select: typeof userDetailSelect;
}>;

export class UserDetailResponseDto extends SessionUserResponseDto {
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(user: UserDetailRecord) {
    super(user);
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}
