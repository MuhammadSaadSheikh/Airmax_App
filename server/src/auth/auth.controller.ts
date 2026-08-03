import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, OtpRequestDto, OtpVerifyDto, RegisterDto } from './dto/auth.dto';
@Controller('auth')
export class AuthController {
  constructor(private readonly auth:AuthService){}
  @Post('login') login(@Body() dto:LoginDto){return this.auth.login(dto.identifier,dto.password)}
  @Post('register') register(@Body() dto:RegisterDto){return this.auth.register(dto)}
  @Post('otp') otp(@Body() dto:OtpRequestDto){return this.auth.requestOtp(dto.phone)}
  @Post('otp/verify') verify(@Body() dto:OtpVerifyDto){return this.auth.verifyOtp(dto.phone,dto.code)}
}
