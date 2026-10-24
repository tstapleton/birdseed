import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MEALS, Meal } from '../../core/api/models';
import { fromIsoDate } from '../../core/time/dates';
import { MealPlanStore, Slot } from './data-access/meal-plan.store';

@Component({
  selector: 'app-meal-plan-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe],
  providers: [MealPlanStore],
  template: `
    <div class="page-head">
      <div>
        <h1>Meal plan</h1>
        @if (store.weekStart()) {
          <p>{{ date(store.weekStart()) | date: 'd MMMM' }} – {{ date(store.weekEnd()) | date: 'd MMMM y' }}</p>
        }
      </div>
      <div class="row">
        <button type="button" (click)="store.moveWeek(-1)">← Previous week</button>
        <button type="button" [disabled]="store.isThisWeek()" (click)="store.thisWeek()">This week</button>
        <button type="button" (click)="store.moveWeek(1)">Next week →</button>
      </div>
    </div>

    @if (store.status() === 'error') {
      <p class="empty" role="alert">The plan could not be loaded.</p>
    }

    <ol class="week" aria-label="Days">
      @for (day of store.days(); track day.date) {
        <li class="day card" [class.today]="day.today" [attr.aria-labelledby]="'day-' + day.date">
          <h2 [id]="'day-' + day.date">
            {{ date(day.date) | date: 'EEEE d MMMM' }}
            @if (day.today) {
              <span class="chip today-chip">Today</span>
            }
          </h2>
          @for (meal of meals; track meal) {
            <section class="slot" [attr.aria-label]="(date(day.date) | date: 'EEEE') + ' ' + meal">
              <h3>{{ meal }}</h3>
              <ul>
                @for (planned of day.meals[meal]; track planned.id) {
                  <li>
                    <a [routerLink]="['/recipes', planned.recipeId]">{{ planned.recipeTitle }}</a>
                    <span class="servings row">
                      <button type="button" class="icon" [attr.aria-label]="'Fewer servings of ' + planned.recipeTitle" [disabled]="planned.servings <= 1"
                        (click)="store.changeServings({ id: planned.id, servings: planned.servings - 1 })">−</button>
                      <span>{{ planned.servings }}</span>
                      <button type="button" class="icon" [attr.aria-label]="'More servings of ' + planned.recipeTitle"
                        (click)="store.changeServings({ id: planned.id, servings: planned.servings + 1 })">+</button>
                    </span>
                    <button type="button" class="icon" [attr.aria-label]="'Remove ' + planned.recipeTitle + ' from ' + (date(day.date) | date: 'EEEE') + ' ' + meal"
                      (click)="store.removeMeal(planned.id)">×</button>
                  </li>
                }
              </ul>
              @if (isAdding(day.date, meal)) {
                <form class="picker" aria-label="Choose a recipe" (submit)="$event.preventDefault(); add(recipe.value, servings.valueAsNumber)">
                  <label class="visually-hidden" [for]="'recipe-' + day.date + meal">Recipe</label>
                  <select #recipe [id]="'recipe-' + day.date + meal" (change)="servingsFor.set(recipe.value)">
                    @for (r of store.recipes(); track r.id) {
                      <option [value]="r.id">{{ r.title }}</option>
                    }
                  </select>
                  <label class="visually-hidden" [for]="'servings-' + day.date + meal">Servings</label>
                  <input #servings type="number" min="1" [id]="'servings-' + day.date + meal" [value]="defaultServings(recipe.value)" />
                  <div class="row">
                    <button type="submit" class="primary">Add</button>
                    <button type="button" (click)="store.cancelAdding()">Cancel</button>
                  </div>
                </form>
              } @else {
                <button type="button" class="ghost add" [attr.aria-label]="'Plan ' + (date(day.date) | date: 'EEEE') + ' ' + meal" (click)="startAdding({ date: day.date, meal })">+ Add</button>
              }
            </section>
          }
        </li>
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
    .day { padding: 12px 14px; display: flex; flex-direction: column; gap: 10px; }
    .day.today { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
    .day h2 { font-size: 15px; display: flex; align-items: center; gap: 8px; }
    .today-chip { background: var(--accent-soft); color: var(--accent-strong); border-color: transparent; }
    .slot h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.07em; color: var(--muted); margin-bottom: 4px; }
    .slot ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
    .slot li { display: flex; align-items: center; gap: 4px; font-size: 14px; }
    .slot li a { flex: 1; color: var(--text); text-decoration: none; font-weight: 500; }
    .slot li a:hover { color: var(--accent); }
    .servings { gap: 0; color: var(--muted); font-size: 13px; flex-wrap: nowrap; }
    .add { padding: 2px 6px; font-size: 13px; color: var(--muted); font-weight: 500; }
    .picker { display: flex; flex-direction: column; gap: 6px; }
    .picker input { width: 80px; }
    .footer { align-items: center; }
  `,
})
export class MealPlanPage {
  protected readonly store = inject(MealPlanStore);
  protected readonly meals = MEALS;
  /** The recipe chosen in the open picker, to suggest its servings. */
  protected readonly servingsFor = signal('');

  protected date(iso: string): Date {
    return fromIsoDate(iso);
  }

  protected isAdding(date: string, meal: Meal): boolean {
    const adding = this.store.adding();
    return adding?.date === date && adding.meal === meal;
  }

  protected startAdding(slot: Slot): void {
    this.servingsFor.set(this.store.recipes()[0]?.id ?? '');
    this.store.startAdding(slot);
  }

  protected defaultServings(recipeId: string): number {
    return this.store.recipes().find((r) => r.id === (this.servingsFor() || recipeId))?.servings ?? 2;
  }

  protected add(recipeId: string, servings: number): void {
    this.store.addMeal({ recipeId, servings: servings > 0 ? servings : 1 });
  }

  protected makeList(): void {
    const start = this.date(this.store.weekStart());
    this.store.makeGroceryList(`Week of ${start.getDate()} ${start.toLocaleString('en-GB', { month: 'long' })}`);
  }
}
