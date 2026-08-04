import { Injectable, computed, signal } from '@angular/core';
import { User, UserRole } from '../models/domain.models';
import { StoreContextService } from './store-context.service';

const SESSION_USER_KEY = 'tailorhub_user';

@Injectable({ providedIn: 'root' })
export class SessionService {
  readonly user = signal<User | null>(this.readUser());
  readonly isAuthenticated = computed(() => this.user() !== null);
  readonly role = computed<UserRole | null>(() => this.user()?.role ?? null);

  constructor(private readonly storeContext: StoreContextService) {}

  setUser(user: User): void {
    this.user.set(user);
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
    this.storeContext.setStoreId(user.storeId);
  }

  clear(): void {
    this.user.set(null);
    localStorage.removeItem(SESSION_USER_KEY);
    this.storeContext.clearStoreId();
  }

  private readUser(): User | null {
    const raw = localStorage.getItem(SESSION_USER_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as User;
    } catch {
      localStorage.removeItem(SESSION_USER_KEY);
      return null;
    }
  }
}
