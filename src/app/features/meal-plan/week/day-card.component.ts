import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MEALS } from '../../../core/api/models';
import { fromIsoDate } from '../../../core/time/dates';
import { PlanDay } from '../data-access/meal-plan.store';
import { MealSlotComponent } from './meal-slot.component';

@Component({
  selector: 'app-day-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MealSlotComponent],
  template: `
    @let d = day();
    <div class="day card" [class.today]="d.today">
      <h2 [id]="'day-' + d.date">
        {{ date() | date: 'EEEE d MMMM' }}
        @if (d.today) {
          <span class="chip today-chip">Today</span>
        }
      </h2>
      @for (meal of meals; track meal) {
        <app-meal-slot [date]="d.date" [meal]="meal" [planned]="d.meals[meal]" />
      }
    </div>
  `,
  styles: `
    .day { padding: 12px 14px; display: flex; flex-direction: column; gap: 10px; height: 100%; }
    .day.today { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
    h2 { font-size: 15px; display: flex; align-items: center; gap: 8px; }
    .today-chip { background: var(--accent-soft); color: var(--accent-strong); border-color: transparent; }
  `,
})
export class DayCardComponent {
  readonly day = input.required<PlanDay>();
  protected readonly meals = MEALS;
  protected readonly date = computed(() => fromIsoDate(this.day().date));
}
