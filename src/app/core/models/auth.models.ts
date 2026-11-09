import { User } from './domain.models';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  role: 'admin' | 'manager' | 'employee' | 'client';
  storeId: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface GoogleLoginRequest {
  credential: string;
  storeId?: string;
  phone?: string;
}

export interface GoogleCalendarLinkRequest {
  authorizationCode: string;
  redirectUri: string;
}

export interface GoogleCalendarLinkResponse {
  linked: boolean;
  calendarEmail: string;
}

export interface AuthResponse {
  accessToken: string;
}

export type HttpErrorCode = 400 | 401 | 403 | 404;
