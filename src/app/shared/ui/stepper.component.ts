import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** − value + buttons, e.g. for servings. */
@Component({
  selector: 'app-stepper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stepper" role="group" [attr.aria-label]="label()">
      <button type="button" class="icon" [attr.aria-label]="lessLabel()" [disabled]="value() <= min()" (click)="changed.emit(value() - 1)">−</button>
      <span aria-live="polite"><strong>{{ value() }}</strong>{{ unit() ? ' ' + unit() : '' }}</span>
      <button type="button" class="icon" [attr.aria-label]="moreLabel()" (click)="changed.emit(value() + 1)">+</button>
    </div>
  `,
  styles: `
    .stepper { display: inline-flex; align-items: center; gap: 4px; background: var(--surface-2); border-radius: 999px; padding: 2px 4px; }
  `,
})
export class StepperComponent {
  readonly value = input.required<number>();
  readonly label = input.required<string>();
  readonly lessLabel = input('Fewer');
  readonly moreLabel = input('More');
  readonly unit = input('');
  readonly min = input(1);

  readonly changed = output<number>();
}
