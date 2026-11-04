import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger';
}

@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogModule],
  template: `
    <section class="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
      <h3 id="confirm-dialog-title">{{ data.title }}</h3>
      <p>{{ data.message }}</p>

      <div class="confirm-dialog-actions">
        <button type="button" class="btn confirm-btn confirm-btn-quiet" (click)="close(false)">
          {{ data.cancelText ?? 'Cancelar' }}
        </button>
        <button
          type="button"
          class="btn confirm-btn"
          [class.confirm-btn-danger]="data.variant === 'danger'"
          [class.confirm-btn-primary]="data.variant !== 'danger'"
          (click)="close(true)"
        >
          {{ data.confirmText ?? 'Confirmar' }}
        </button>
      </div>
    </section>
  `,
  styles: [
    `
      .confirm-dialog {
        display: grid;
        gap: 0.85rem;
        padding: 1rem;
        max-width: min(460px, calc(100vw - 2rem));
      }

      .confirm-dialog h3 {
        margin: 0;
        color: #111827;
        font-size: 1.02rem;
        font-weight: 700;
      }

      .confirm-dialog p {
        margin: 0;
        color: #374151;
        font-size: 0.9rem;
        line-height: 1.4;
        white-space: pre-line;
      }

      .confirm-dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
      }

      .confirm-btn {
        padding: 0.32rem 0.66rem;
        border: 1px solid #d1d5db;
        font-size: 0.78rem;
        line-height: 1.2;
        border-radius: 0.5rem;
        background: #fff;
      }

      .confirm-btn-primary {
        color: #0f172a;
        border-color: #cbd5e1;
        background: #f1f5f9;
      }

      .confirm-btn-quiet {
        color: #4b5563;
      }

      .confirm-btn-danger {
        color: #991b1b;
        border-color: #fecaca;
        background: #fff7f7;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent, boolean>);

  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);

  close(value: boolean): void {
    this.dialogRef.close(value);
  }
}
