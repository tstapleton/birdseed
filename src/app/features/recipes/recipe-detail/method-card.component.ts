import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-method-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="card card-body" aria-labelledby="method-title">
      <h2 id="method-title">Method</h2>
      <ol class="steps">
        @for (step of steps(); track $index) {
          <li>{{ step }}</li>
        }
      </ol>
    </section>
  `,
  styles: `
    h2 { margin-bottom: 12px; }
    .steps { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 12px; }
  `,
})
export class MethodCardComponent {
  readonly steps = input.required<string[]>();
}
