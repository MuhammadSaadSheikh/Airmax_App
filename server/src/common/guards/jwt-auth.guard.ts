import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import type { AuthUser } from '../decorators/current-user.decorator';
import {
  loadSecurityConfig,
  type SecurityConfig,
} from '../../config/security.config';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly security: SecurityConfig;

  constructor(private readonly jwt: JwtService, config: ConfigService) {
    this.security = loadSecurityConfig(config);
  }

  async canActivate(context: ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest<{ headers: { authorization?: string }; user?: AuthUser }>();
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException('Missing access token');
    try {
      const payload = await this.jwt.verifyAsync<AuthUser>(token, {
        secret: this.security.accessTokenSecret,
        issuer: this.security.jwtIssuer,
        audience: this.security.jwtAudience,
        algorithms: ['HS256'],
      });
      if (
        payload.tokenType !== 'access' ||
        !payload.sub ||
        !payload.phone ||
        !payload.jti ||
        !Object.values(Role).includes(payload.role)
      ) {
        throw new UnauthorizedException('Invalid access token');
      }
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}
