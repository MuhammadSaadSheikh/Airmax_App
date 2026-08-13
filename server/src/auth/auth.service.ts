import {
  Inject,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role, UserStatus, type User } from '@prisma/client';
import { compare, hash } from 'bcryptjs';
import {
  createHash,
  createHmac,
  randomInt,
  randomUUID,
} from 'node:crypto';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import {
  OTP_DELIVERY_PROVIDER,
  type OtpDeliveryProvider,
} from '../common/security/otp-delivery.provider';
import {
  loadSecurityConfig,
  type SecurityConfig,
} from '../config/security.config';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { SessionUserResponseDto } from '../users/dto/user-response.dto';
import type { RegisterDto } from './dto/auth.dto';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '30d';
const REFRESH_TOKEN_LIFETIME_MS = 30 * 24 * 60 * 60 * 1_000;
const OTP_LIFETIME_SECONDS = 5 * 60;
const OTP_COOLDOWN_SECONDS = 60;
const OTP_MAX_ATTEMPTS = 5;

const VERIFY_OTP_SCRIPT = `
local value = redis.call('GET', KEYS[1])
if not value then return -1 end
local challenge = cjson.decode(value)
if tonumber(challenge.expiresAt) <= tonumber(ARGV[1]) then
  redis.call('DEL', KEYS[1])
  return -1
end
if challenge.phone ~= ARGV[2] or challenge.codeHash ~= ARGV[3] then
  challenge.attempts = tonumber(challenge.attempts) + 1
  if challenge.attempts >= tonumber(ARGV[4]) then
    redis.call('DEL', KEYS[1])
    return -2
  end
  local ttl = redis.call('PTTL', KEYS[1])
  if ttl > 0 then redis.call('SET', KEYS[1], cjson.encode(challenge), 'PX', ttl) end
  return 0
end
redis.call('DEL', KEYS[1])
return 1
`;

type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

type AuthResponse = TokenPair & {
  user: SessionUserResponseDto;
};

type RegistrationResponse = {
  user: SessionUserResponseDto;
};

@Injectable()
export class AuthService {
  private readonly security: SecurityConfig;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    config: ConfigService,
    private readonly redis: RedisService,
    @Inject(OTP_DELIVERY_PROVIDER)
    private readonly otpDelivery: OtpDeliveryProvider,
  ) {
    // AuthService is eagerly constructed, so invalid security settings stop startup.
    this.security = loadSecurityConfig(config);
  }

  async register(input: RegisterDto): Promise<RegistrationResponse> {
    const user = await this.prisma.user.create({
      data: {
        name: input.name,
        phone: input.phone,
        email: input.email,
        passwordHash: await hash(input.password, 12),
        role: Role.CUSTOMER,
      },
    });
    // New users are PENDING by schema policy and cannot receive a session yet.
    return { user: new SessionUserResponseDto(user) };
  }

  async login(identifier: string, password: string): Promise<AuthResponse> {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ phone: identifier }, { email: identifier }] },
    });
    if (!user || !(await compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    this.assertAccountActive(user);
    return this.issueSession(user);
  }

  async requestOtp(phone: string): Promise<{ challengeId: string }> {
    const cooldownKey = this.otpCooldownKey(phone);
    const cooldownAcquired = await this.redis.set(
      cooldownKey,
      '1',
      'EX',
      OTP_COOLDOWN_SECONDS,
      'NX',
    );
    if (cooldownAcquired !== 'OK') {
      throw new HttpException(
        'OTP request cooldown is active',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const challengeId = randomUUID();
    const challengeKey = this.otpChallengeKey(challengeId);
    const challenge = JSON.stringify({
      phone,
      codeHash: this.hashOtp(phone, challengeId, code),
      attempts: 0,
      expiresAt: Date.now() + OTP_LIFETIME_SECONDS * 1_000,
    });

    try {
      await this.redis.set(
        challengeKey,
        challenge,
        'EX',
        OTP_LIFETIME_SECONDS,
      );
      await this.otpDelivery.send(phone, code);
    } catch (error) {
      await Promise.all([
        this.redis.del(challengeKey),
        this.redis.del(cooldownKey),
      ]);
      throw error;
    }

    return { challengeId };
  }

  async verifyOtp(
    phone: string,
    challengeId: string,
    code: string,
  ): Promise<AuthResponse> {
    const result = Number(
      await this.redis.eval(
        VERIFY_OTP_SCRIPT,
        1,
        this.otpChallengeKey(challengeId),
        Date.now().toString(),
        phone,
        this.hashOtp(phone, challengeId, code),
        OTP_MAX_ATTEMPTS.toString(),
      ),
    );
    if (result !== 1) throw new UnauthorizedException('Invalid or expired OTP');

    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) throw new UnauthorizedException('Invalid or expired OTP');
    this.assertAccountActive(user);
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

    if (!storedToken || storedToken.userId !== payload.sub) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    if (storedToken.revokedAt) {
      await this.revokeAllRefreshTokens(storedToken.userId, now);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    if (storedToken.expiresAt <= now) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    this.assertAccountActive(storedToken.user);
    const nextTokens = await this.generateTokenPair(storedToken.user);
    const nextTokenHash = this.hashToken(nextTokens.refreshToken);

    const rotated = await this.prisma.$transaction(async transaction => {
      const revoked = await transaction.refreshToken.updateMany({
        where: {
          id: storedToken.id,
          userId: payload.sub,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        data: { revokedAt: now },
      });
      if (revoked.count !== 1) return false;

      await transaction.refreshToken.create({
        data: {
          userId: storedToken.userId,
          tokenHash: nextTokenHash,
          expiresAt: new Date(now.getTime() + REFRESH_TOKEN_LIFETIME_MS),
        },
      });
      return true;
    });

    if (!rotated) {
      // A concurrent request used the same token first: contain the replay.
      await this.revokeAllRefreshTokens(storedToken.userId, new Date());
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

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
    this.assertAccountActive(user);
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
    const common = {
      issuer: this.security.jwtIssuer,
      audience: this.security.jwtAudience,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { ...identity, tokenType: 'access', jti: randomUUID() },
        {
          ...common,
          secret: this.security.accessTokenSecret,
          algorithm: 'HS256',
          expiresIn: ACCESS_TOKEN_TTL,
        },
      ),
      this.jwt.signAsync(
        { ...identity, tokenType: 'refresh', jti: randomUUID() },
        {
          ...common,
          secret: this.security.refreshTokenSecret,
          algorithm: 'HS256',
          expiresIn: REFRESH_TOKEN_TTL,
        },
      ),
    ]);
    return { accessToken, refreshToken };
  }

  private async verifyRefreshToken(refreshToken: string): Promise<AuthUser> {
    try {
      const payload = await this.jwt.verifyAsync<AuthUser>(refreshToken, {
        secret: this.security.refreshTokenSecret,
        issuer: this.security.jwtIssuer,
        audience: this.security.jwtAudience,
        algorithms: ['HS256'],
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

  private assertAccountActive(user: Pick<User, 'status'>): void {
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }
  }

  private authResponse(user: User, tokens: TokenPair): AuthResponse {
    return { ...tokens, user: new SessionUserResponseDto(user) };
  }

  private revokeAllRefreshTokens(userId: string, revokedAt: Date) {
    return this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt },
    });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private hashOtp(phone: string, challengeId: string, code: string): string {
    return createHmac('sha256', this.security.otpPepper)
      .update(`${phone}:${challengeId}:${code}`)
      .digest('hex');
  }

  private otpChallengeKey(challengeId: string): string {
    return `otp:challenge:${this.hashToken(challengeId)}`;
  }

  private otpCooldownKey(phone: string): string {
    return `otp:cooldown:${this.hashToken(phone)}`;
  }
}
