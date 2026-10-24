import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Toaster } from './toaster';

@Component({
  selector: 'app-toast-outlet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toasts" aria-live="polite">
      @for (toast of toaster.toasts(); track toast.id) {
        <div class="toast" [class.error]="toast.kind === 'error'" role="status">
          <span>{{ toast.message }}</span>
          <button type="button" class="icon" aria-label="Dismiss" (click)="toaster.dismiss(toast.id)">×</button>
        </div>
      }
    </div>
  `,
})
export class ToastOutletComponent {
  protected readonly toaster = inject(Toaster);
}
