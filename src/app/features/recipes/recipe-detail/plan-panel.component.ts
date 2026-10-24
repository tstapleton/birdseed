import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MEALS, Meal } from '../../../core/api/models';
import { Clock } from '../../../core/time/clock';
import { addDays, toIsoDate } from '../../../core/time/dates';
import { RecipeDetailStore } from '../data-access/recipe-detail.store';

/** Plans the recipe for a day and meal in the coming week. */
@Component({
  selector: 'app-plan-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="panel card card-body" aria-label="Add to meal plan" (submit)="$event.preventDefault(); plan(day.value, $any(meal.value))">
      <div class="row">
        <div class="field">
          <label for="plan-date">Day</label>
          <select id="plan-date" #day>
            @for (option of days; track option.iso) {
              <option [value]="option.iso">{{ option.label }}</option>
            }
          </select>
        </div>
        <div class="field">
          <label for="plan-meal">Meal</label>
          <select id="plan-meal" #meal>
            @for (option of meals; track option) {
              <option [value]="option" [selected]="option === 'dinner'">{{ option }}</option>
            }
          </select>
        </div>
      </div>
      <p class="muted">For {{ store.servings() }} servings.</p>
      <div class="row">
        <button type="submit" class="primary" [disabled]="store.planning().saving">Add to plan</button>
        <button type="button" (click)="store.togglePlanning()">Cancel</button>
      </div>
    </form>
  `,
  styles: `
    .panel { margin-bottom: 20px; display: flex; flex-direction: column; gap: 12px; }
  `,
})
export class PlanPanelComponent {
  protected readonly store = inject(RecipeDetailStore);
  protected readonly meals = MEALS;
  /** Today and the six days after it. */
  protected readonly days = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(inject(Clock).today(), i);
    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : day.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    return { iso: toIsoDate(day), label };
  });

  protected plan(date: string, meal: Meal): void {
    void this.store.addToPlan({ date, meal });
  }
}
