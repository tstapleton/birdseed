import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Meal, PlannedMeal } from '../../../core/api/models';
import { fromIsoDate } from '../../../core/time/dates';
import { MealPlanStore } from '../data-access/meal-plan.store';

/** Breakfast, lunch or dinner on one day: what's planned, and a picker to add more. */
@Component({
  selector: 'app-meal-slot',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink],
  template: `
    @let name = (day() | date: 'EEEE') + ' ' + meal();
    <section class="slot" [attr.aria-label]="name">
      <h3>{{ meal() }}</h3>
      <ul>
        @for (planned of planned(); track planned.id) {
          <li>
            <a [routerLink]="['/recipes', planned.recipeId]">{{ planned.recipeTitle }}</a>
            <span class="servings row">
              <button type="button" class="icon" [attr.aria-label]="'Fewer servings of ' + planned.recipeTitle" [disabled]="planned.servings <= 1"
                (click)="store.changeServings({ id: planned.id, servings: planned.servings - 1 })">−</button>
              <span>{{ planned.servings }}</span>
              <button type="button" class="icon" [attr.aria-label]="'More servings of ' + planned.recipeTitle"
                (click)="store.changeServings({ id: planned.id, servings: planned.servings + 1 })">+</button>
            </span>
            <button type="button" class="icon" [attr.aria-label]="'Remove ' + planned.recipeTitle + ' from ' + name" (click)="store.removeMeal(planned.id)">×</button>
          </li>
        }
      </ul>
      @if (picking()) {
        <form class="picker" aria-label="Choose a recipe" (submit)="$event.preventDefault(); add(servings.valueAsNumber)">
          <label class="visually-hidden" [for]="id('recipe')">Recipe</label>
          <select [id]="id('recipe')" (change)="recipeId.set($any($event.target).value)">
            @for (r of store.recipes(); track r.id) {
              <option [value]="r.id" [selected]="r.id === recipeId()">{{ r.title }}</option>
            }
          </select>
          <label class="visually-hidden" [for]="id('servings')">Servings</label>
          <input #servings type="number" min="1" [id]="id('servings')" [value]="defaultServings()" />
          <div class="row">
            <button type="submit" class="primary">Add</button>
            <button type="button" (click)="store.cancelAdding()">Cancel</button>
          </div>
        </form>
      } @else {
        <button type="button" class="ghost add" [attr.aria-label]="'Plan ' + name" (click)="startPicking()">+ Add</button>
      }
    </section>
  `,
  styles: `
    h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.07em; color: var(--muted); margin-bottom: 4px; }
    ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
    li { display: flex; align-items: center; gap: 4px; font-size: 14px; }
    li a { flex: 1; color: var(--text); text-decoration: none; font-weight: 500; }
    li a:hover { color: var(--accent); }
    .servings { gap: 0; color: var(--muted); font-size: 13px; flex-wrap: nowrap; }
    .add { padding: 2px 6px; font-size: 13px; color: var(--muted); font-weight: 500; }
    .picker { display: flex; flex-direction: column; gap: 6px; }
    .picker input { width: 80px; }
  `,
})
export class MealSlotComponent {
  /** ISO date. */
  readonly date = input.required<string>();
  readonly meal = input.required<Meal>();
  readonly planned = input.required<PlannedMeal[]>();

  protected readonly store = inject(MealPlanStore);
  protected readonly day = computed(() => fromIsoDate(this.date()));
  /** Only one slot's picker is open at a time; the store knows which. */
  protected readonly picking = computed(() => this.store.adding()?.date === this.date() && this.store.adding()?.meal === this.meal());
  protected readonly recipeId = signal('');
  protected readonly defaultServings = computed(() => this.store.recipes().find((r) => r.id === this.recipeId())?.servings ?? 2);

  protected id(part: string): string {
    return `${part}-${this.date()}-${this.meal()}`;
  }

  protected startPicking(): void {
    this.recipeId.set(this.store.recipes()[0]?.id ?? '');
    this.store.startAdding({ date: this.date(), meal: this.meal() });
  }

  protected add(servings: number): void {
    void this.store.addMeal({ recipeId: this.recipeId(), servings: servings > 0 ? servings : 1 });
  }
}
