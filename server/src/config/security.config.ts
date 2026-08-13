import { ConfigService } from '@nestjs/config';

export interface SecurityConfig {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  jwtIssuer: string;
  jwtAudience: string;
  otpPepper: string;
}

const MINIMUM_SECRET_LENGTH = 32;

function required(config: ConfigService, key: string): string {
  const value = config.get<string>(key)?.trim();
  if (!value) throw new Error(`${key} must be configured`);
  return value;
}

function strongSecret(config: ConfigService, key: string): string {
  const value = required(config, key);
  if (value.length < MINIMUM_SECRET_LENGTH) {
    throw new Error(`${key} must be at least ${MINIMUM_SECRET_LENGTH} characters`);
  }
  return value;
}

/** Read and validate security-critical settings during provider construction. */
export function loadSecurityConfig(config: ConfigService): SecurityConfig {
  const result = {
    accessTokenSecret: strongSecret(config, 'JWT_ACCESS_SECRET'),
    refreshTokenSecret: strongSecret(config, 'JWT_REFRESH_SECRET'),
    jwtIssuer: required(config, 'JWT_ISSUER'),
    jwtAudience: required(config, 'JWT_AUDIENCE'),
    otpPepper: strongSecret(config, 'OTP_PEPPER'),
  };

  if (result.accessTokenSecret === result.refreshTokenSecret) {
    throw new Error('JWT access and refresh secrets must be different');
  }
  return result;
}
