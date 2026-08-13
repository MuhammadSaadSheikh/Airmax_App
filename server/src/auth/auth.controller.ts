import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import {
  AUTH_RATE_LIMITS,
  AUTH_THROTTLER_NAME,
} from '../common/security/auth-rate-limits';
import { AuthService } from './auth.service';
import {
  LoginDto,
  LogoutDto,
  OtpRequestDto,
  OtpVerifyDto,
  RefreshDto,
  RegisterDto,
} from './dto/auth.dto';

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ [AUTH_THROTTLER_NAME]: AUTH_RATE_LIMITS.login })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.identifier, dto.password);
  }

  @Post('register')
  @Throttle({ [AUTH_THROTTLER_NAME]: AUTH_RATE_LIMITS.register })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ [AUTH_THROTTLER_NAME]: AUTH_RATE_LIMITS.otpRequest })
  otp(@Body() dto: OtpRequestDto) {
    return this.auth.requestOtp(dto.phone);
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ [AUTH_THROTTLER_NAME]: AUTH_RATE_LIMITS.otpVerify })
  verify(@Body() dto: OtpVerifyDto) {
    return this.auth.verifyOtp(dto.phone, dto.challengeId, dto.code);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ [AUTH_THROTTLER_NAME]: AUTH_RATE_LIMITS.refresh })
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ [AUTH_THROTTLER_NAME]: AUTH_RATE_LIMITS.logout })
  async logout(@Body() dto: LogoutDto): Promise<void> {
    await this.auth.logout(dto.refreshToken);
  }
}
