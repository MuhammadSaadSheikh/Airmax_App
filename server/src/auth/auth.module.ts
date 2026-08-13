import { Module } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import {
  AUTH_THROTTLER_NAME,
  AUTH_RATE_LIMITS,
} from '../common/security/auth-rate-limits';
import {
  OTP_DELIVERY_PROVIDER,
  UnavailableOtpDeliveryProvider,
} from '../common/security/otp-delivery.provider';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: AUTH_THROTTLER_NAME,
        ttl: AUTH_RATE_LIMITS.login.ttl,
        limit: AUTH_RATE_LIMITS.login.limit,
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    ThrottlerGuard,
    UnavailableOtpDeliveryProvider,
    {
      provide: OTP_DELIVERY_PROVIDER,
      useExisting: UnavailableOtpDeliveryProvider,
    },
  ],
})
export class AuthModule {}
