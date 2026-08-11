import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Role } from '@prisma/client';

export type TokenType = 'access' | 'refresh';

export interface AuthUser {
  sub: string;
  role: Role;
  phone: string;
  tokenType: TokenType;
  jti: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    context.switchToHttp().getRequest<{ user: AuthUser }>().user,
);
