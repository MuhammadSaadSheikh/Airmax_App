import { IsEmail, IsEnum, IsOptional, IsPhoneNumber, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';
export class LoginDto { @IsString() identifier!: string; @IsString() @MinLength(8) password!: string; }
export class RegisterDto {
  @IsString() name!: string; @IsPhoneNumber() phone!: string; @IsOptional() @IsEmail() email?: string;
  @IsString() @MinLength(8) password!: string; @IsOptional() @IsEnum(Role) role?: Role;
}
export class OtpRequestDto { @IsPhoneNumber() phone!: string; }
export class OtpVerifyDto extends OtpRequestDto { @IsString() code!: string; }
export class RefreshDto { @IsString() refreshToken!: string; }
