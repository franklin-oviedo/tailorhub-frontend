import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { map, Observable, switchMap, tap } from 'rxjs';
import {
  AuthResponse,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest
} from '../../../core/models/auth.models';
import { User } from '../../../core/models/domain.models';
import { ApiConfigService } from '../../../core/services/api-config.service';
import { SessionService } from '../../../core/services/session.service';
import { TokenService } from '../../../core/services/token.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfigService);
  private readonly tokenService = inject(TokenService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.config.baseUrl}/auth/login`, payload)
      .pipe(switchMap((response) => this.applySession(response)));
  }

  register(payload: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.config.baseUrl}/auth/register`, payload)
      .pipe(switchMap((response) => this.applySession(response)));
  }

  forgotPassword(payload: ForgotPasswordRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.config.baseUrl}/auth/forgot-password`, payload);
  }

  logout(): void {
    this.tokenService.clearToken();
    this.session.clear();
    this.router.navigate(['/login']);
  }

  private applySession(response: AuthResponse): Observable<AuthResponse> {
    this.tokenService.setToken(response.accessToken);
    return this.http.get<User>(`${this.config.baseUrl}/users/me`).pipe(
      tap((user) => this.session.setUser(user)),
      map(() => response)
    );
  }
}
