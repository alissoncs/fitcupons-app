import type { AuthProvider, UserRole } from '../enums';

export type SportSummary = {
  id: string;
  slug: string;
  name: string;
  iconName: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type MeResponse = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
  emailVerified: boolean;
  onboarded: boolean;
  hasPassword: boolean;
  providers: AuthProvider[];
  sports: SportSummary[];
};

export type EmailRegisterBody = { email: string; password: string; name: string };
export type EmailLoginBody = { email: string; password: string };
export type GoogleAuthBody = { idToken: string };
export type AppleAuthBody = { identityToken: string; authorizationCode?: string };
export type RefreshBody = { refreshToken: string };
export type PasswordForgotBody = { email: string };
export type PasswordResetBody = { token: string; password: string };
export type PasswordChangeBody = { currentPassword?: string; newPassword: string };
export type VerifyEmailBody = { token: string };
export type UpdateMeBody = { name?: string; avatarUrl?: string };
export type SetSportsBody = { sportIds: string[] };
export type AdminLoginBody = { email: string; password: string };
export type AdminLoginResponse = { accessToken: string; expiresIn: number };
