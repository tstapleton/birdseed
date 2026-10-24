import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** What to fix before a form can be saved. */
@Component({
  selector: 'app-error-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="error-summary" role="alert">
      <strong>{{ heading() }}</strong>
      <ul>
        @for (message of messages(); track message) {
          <li>{{ message }}</li>
        }
      </ul>
    </div>
  `,
  styles: `
    .error-summary { padding: 12px 16px; border: 1px solid var(--danger); border-radius: var(--radius); background: var(--danger-soft); }
    ul { margin: 6px 0 0; padding-left: 20px; }
  `,
})
export class ErrorSummaryComponent {
  readonly heading = input('Check the form before saving:');
  readonly messages = input.required<string[]>();
}
