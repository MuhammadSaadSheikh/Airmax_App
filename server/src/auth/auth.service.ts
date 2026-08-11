import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role, UserStatus, type User } from '@prisma/client';
import { compare, hash } from 'bcryptjs';
import { createHash, randomInt, randomUUID } from 'node:crypto';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { SessionUserResponseDto } from '../users/dto/user-response.dto';
import type { RegisterDto } from './dto/auth.dto';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '30d';
const REFRESH_TOKEN_LIFETIME_MS = 30 * 24 * 60 * 60 * 1_000;

type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

type AuthResponse = TokenPair & {
  user: SessionUserResponseDto;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  async register(input: RegisterDto): Promise<AuthResponse> {
    const user = await this.prisma.user.create({
      data: {
        name: input.name,
        phone: input.phone,
        email: input.email,
        passwordHash: await hash(input.password, 12),
        role: Role.CUSTOMER,
      },
    });
    return this.issueSession(user);
  }

  async login(identifier: string, password: string): Promise<AuthResponse> {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ phone: identifier }, { email: identifier }] },
    });
    if (!user || !(await compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    this.assertAccountEnabled(user);
    return this.issueSession(user);
  }

  async requestOtp(phone: string) {
    const code = randomInt(100000, 999999).toString();
    await this.redis.set(`otp:${phone}`, code, 'EX', 300);
    return {
      challengeId: createHash('sha256').update(phone + code).digest('hex'),
      developmentCode: process.env.NODE_ENV === 'production' ? undefined : code,
    };
  }

  async verifyOtp(phone: string, code: string): Promise<AuthResponse> {
    const expected = await this.redis.get(`otp:${phone}`);
    if (expected !== code) throw new UnauthorizedException('Invalid OTP');

    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) throw new UnauthorizedException('Invalid OTP');
    this.assertAccountEnabled(user);

    await this.redis.del(`otp:${phone}`);
    return this.issueSession(user);
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const tokenHash = this.hashToken(refreshToken);
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    const now = new Date();

    if (
      !storedToken ||
      storedToken.userId !== payload.sub ||
      storedToken.revokedAt ||
      storedToken.expiresAt <= now
    ) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    this.assertAccountEnabled(storedToken.user);
    const nextTokens = await this.generateTokenPair(storedToken.user);
    const nextTokenHash = this.hashToken(nextTokens.refreshToken);

    await this.prisma.$transaction(async transaction => {
      const revoked = await transaction.refreshToken.updateMany({
        where: {
          id: storedToken.id,
          userId: payload.sub,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        data: { revokedAt: now },
      });
      if (revoked.count !== 1) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }
      await transaction.refreshToken.create({
        data: {
          userId: storedToken.userId,
          tokenHash: nextTokenHash,
          expiresAt: new Date(now.getTime() + REFRESH_TOKEN_LIFETIME_MS),
        },
      });
    });

    return this.authResponse(storedToken.user, nextTokens);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        tokenHash: this.hashToken(refreshToken),
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  private async issueSession(user: User): Promise<AuthResponse> {
    this.assertAccountEnabled(user);
    const tokens = await this.generateTokenPair(user);
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(tokens.refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_LIFETIME_MS),
      },
    });
    return this.authResponse(user, tokens);
  }

  private async generateTokenPair(user: User): Promise<TokenPair> {
    const identity = { sub: user.id, role: user.role, phone: user.phone };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { ...identity, tokenType: 'access', jti: randomUUID() },
        {
          secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
          expiresIn: ACCESS_TOKEN_TTL,
        },
      ),
      this.jwt.signAsync(
        { ...identity, tokenType: 'refresh', jti: randomUUID() },
        {
          secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
          expiresIn: REFRESH_TOKEN_TTL,
        },
      ),
    ]);
    return { accessToken, refreshToken };
  }

  private async verifyRefreshToken(refreshToken: string): Promise<AuthUser> {
    try {
      const payload = await this.jwt.verifyAsync<AuthUser>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
      if (
        payload.tokenType !== 'refresh' ||
        !payload.sub ||
        !payload.phone ||
        !payload.jti ||
        !Object.values(Role).includes(payload.role)
      ) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private assertAccountEnabled(user: Pick<User, 'status'>): void {
    if (user.status === UserStatus.DISABLED) {
      throw new UnauthorizedException('Account is disabled');
    }
  }

  private authResponse(user: User, tokens: TokenPair): AuthResponse {
    return { ...tokens, user: new SessionUserResponseDto(user) };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
