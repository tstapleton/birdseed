import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** An inline "are you sure?" for destructive actions. */
@Component({
  selector: 'app-confirm-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="confirm" role="alertdialog" aria-labelledby="confirm-title">
      <p id="confirm-title"><strong>{{ question() }}</strong> {{ detail() }}</p>
      <div class="row">
        <button type="button" class="danger solid" [disabled]="busy()" (click)="confirmed.emit()">{{ confirmLabel() }}</button>
        <button type="button" (click)="cancelled.emit()">Cancel</button>
      </div>
    </div>
  `,
  styles: `
    .confirm {
      display: flex; flex-direction: column; gap: 10px; padding: 14px 16px; margin-bottom: 20px;
      border: 1px solid var(--danger); border-radius: var(--radius); background: var(--danger-soft);
    }
  `,
})
export class ConfirmPanelComponent {
  readonly question = input.required<string>();
  readonly detail = input('');
  readonly confirmLabel = input('Delete');
  readonly busy = input(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
