import type {
  AuthSession,
  CurrentUser,
  LoginInput,
  OtpChallenge,
  RegisterInput,
  RegistrationResult,
} from './auth.models';

export interface AuthenticationService {
  login(input: LoginInput): Promise<AuthSession>;
  register(input: RegisterInput): Promise<RegistrationResult>;
  requestOtp(phone: string): Promise<OtpChallenge>;
  verifyOtp(
    phone: string,
    challengeId: string,
    code: string,
  ): Promise<AuthSession>;
  refresh(refreshToken: string): Promise<AuthSession>;
  logout(refreshToken: string): Promise<void>;
  getCurrentUser(): Promise<CurrentUser>;
}
