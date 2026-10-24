import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-week-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="row">
      <button type="button" (click)="moved.emit(-1)">← Previous week</button>
      <button type="button" [disabled]="isThisWeek()" (click)="today.emit()">This week</button>
      <button type="button" (click)="moved.emit(1)">Next week →</button>
    </div>
  `,
})
export class WeekNavComponent {
  readonly isThisWeek = input(false);
  /** By how many weeks. */
  readonly moved = output<number>();
  readonly today = output<void>();
}
