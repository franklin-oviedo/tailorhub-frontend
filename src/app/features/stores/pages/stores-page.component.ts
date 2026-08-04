import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '../../../core/models/domain.models';
import { StoresService } from '../data-access/stores.service';

@Component({
  selector: 'app-stores-page',
  imports: [ReactiveFormsModule],
  template: `
    <div class="grid">
      <article class="th-card">
        <header class="th-card-head">
          <h2 class="th-card-title">Nueva tienda</h2>
        </header>
        <div class="th-card-body">
        <form [formGroup]="form" (ngSubmit)="createStore()" class="th-form-grid">
          <div>
            <label class="form-label" for="store-name">Nombre</label>
            <input id="store-name" class="form-control th-input" formControlName="name" />
          </div>

          <div>
            <label class="form-label" for="store-address">Direccion</label>
            <input id="store-address" class="form-control th-input" formControlName="address" />
          </div>

          <div>
            <label class="form-label" for="store-phone">Telefono</label>
            <input id="store-phone" class="form-control th-input" formControlName="phone" />
          </div>

          <div class="th-form-actions">
            <button class="btn th-btn-primary" type="submit" [disabled]="form.invalid">
              Crear tienda
            </button>
          </div>
        </form>
        </div>
      </article>

      <article class="th-card">
        <header class="th-card-head">
          <h2 class="th-card-title">Tiendas</h2>
        </header>
        <div class="th-card-body">
        <div class="th-table-shell">
        <div class="th-table-scroll">
        <table class="table table-hover align-middle">
          <thead>
            <tr>
              <th scope="col">Nombre</th>
              <th scope="col">Direccion</th>
              <th scope="col">Telefono</th>
            </tr>
          </thead>
          <tbody>
            @for (store of stores(); track store.id) {
              <tr>
                <td>{{ store.name }}</td>
                <td>{{ store.address }}</td>
                <td>{{ store.phone || '-' }}</td>
              </tr>
            }
          </tbody>
        </table>
        </div>
        </div>
        </div>
      </article>
    </div>
  `,
  styles: `
    .grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StoresPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly storesService = inject(StoresService);

  readonly stores = signal<Store[]>([]);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    address: ['', Validators.required],
    phone: ['']
  });

  constructor() {
    this.load();
  }

  createStore(): void {
    if (this.form.invalid) {
      return;
    }

    this.storesService.create(this.form.getRawValue()).subscribe(() => {
      this.form.reset({ name: '', address: '', phone: '' });
      this.load();
    });
  }

  private load(): void {
    this.storesService.list({ page: 1, limit: 20 }).subscribe((response) => this.stores.set(response.data));
  }
}
