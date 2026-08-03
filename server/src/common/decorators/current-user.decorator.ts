import { createParamDecorator, ExecutionContext } from '@nestjs/common';
export interface AuthUser { sub: string; role: 'ADMIN' | 'CUSTOMER'; phone: string; }
export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext) => context.switchToHttp().getRequest<{user:AuthUser}>().user);
