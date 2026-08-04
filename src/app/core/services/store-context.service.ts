import { Injectable, signal } from '@angular/core';

const STORE_ID_KEY = 'tailorhub_store_id';

@Injectable({ providedIn: 'root' })
export class StoreContextService {
  readonly storeId = signal<string | null>(localStorage.getItem(STORE_ID_KEY));

  setStoreId(storeId: string): void {
    this.storeId.set(storeId);
    localStorage.setItem(STORE_ID_KEY, storeId);
  }

  clearStoreId(): void {
    this.storeId.set(null);
    localStorage.removeItem(STORE_ID_KEY);
  }
}
