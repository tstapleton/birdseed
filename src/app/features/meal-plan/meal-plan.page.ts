import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { fromIsoDate } from '../../core/time/dates';
import { MealPlanStore } from './data-access/meal-plan.store';
import { DayCardComponent } from './week/day-card.component';
import { WeekNavComponent } from './week/week-nav.component';

@Component({
  selector: 'app-meal-plan-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DayCardComponent, WeekNavComponent],
  providers: [MealPlanStore],
  template: `
    <div class="page-head">
      <div>
        <h1>Meal plan</h1>
        @if (store.weekStart()) {
          <p>{{ date(store.weekStart()) | date: 'd MMMM' }} – {{ date(store.weekEnd()) | date: 'd MMMM y' }}</p>
        }
      </div>
      <app-week-nav [isThisWeek]="store.isThisWeek()" (moved)="store.moveWeek($event)" (today)="store.thisWeek()" />
    </div>

    @if (store.status() === 'error') {
      <p class="empty" role="alert">The plan could not be loaded.</p>
    }

    <ol class="week" aria-label="Days">
      @for (day of store.days(); track day.date) {
        <li [attr.aria-labelledby]="'day-' + day.date"><app-day-card [day]="day" /></li>
      }
    </ol>

    <div class="footer card card-body row">
      <p>{{ store.meals().length }} meals planned this week.</p>
      <span class="spacer"></span>
      <button type="button" class="primary" [disabled]="!store.meals().length || store.generating()" (click)="makeList()">
        {{ store.generating() ? 'Making list…' : 'Make a grocery list' }}
      </button>
    </div>
  `,
  styles: `
    .week { list-style: none; margin: 0 0 16px; padding: 0; display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }
    .footer { align-items: center; }
  `,
})
export class MealPlanPage {
  protected readonly store = inject(MealPlanStore);

  protected date(iso: string): Date {
    return fromIsoDate(iso);
  }

  protected makeList(): void {
    const start = this.date(this.store.weekStart());
    void this.store.makeGroceryList(`Week of ${start.getDate()} ${start.toLocaleString('en-GB', { month: 'long' })}`);
  }
}
