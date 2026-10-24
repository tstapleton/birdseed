import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Recipe } from '../../../core/api/models';

/** A recipe's title, details and actions. */
@Component({
  selector: 'app-recipe-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    @let r = recipe();
    <header class="head">
      <div class="stack">
        <h1 id="title">{{ r.title }}</h1>
        <p class="muted">{{ r.description }}</p>
        <div class="row">
          @for (tag of r.tags; track tag) {
            <span class="chip">{{ tag }}</span>
          }
        </div>
        <dl class="times">
          <div><dt>Prep</dt><dd>{{ r.prepMinutes }} min</dd></div>
          <div><dt>Cook</dt><dd>{{ r.cookMinutes }} min</dd></div>
          <div><dt>Total</dt><dd>{{ r.prepMinutes + r.cookMinutes }} min</dd></div>
        </dl>
      </div>
      <div class="actions row">
        <button type="button" class="primary" [attr.aria-expanded]="shoppingOpen()" (click)="shop.emit()">Add to grocery list</button>
        <button type="button" [attr.aria-expanded]="planningOpen()" (click)="plan.emit()">Add to meal plan</button>
        <a class="button" [routerLink]="['/recipes', r.id, 'edit']">Edit</a>
        <button type="button" class="danger" (click)="remove.emit()">Delete</button>
      </div>
    </header>
  `,
  styles: `
    .head { display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
    .head .stack { max-width: 640px; }
    .times { display: flex; gap: 24px; margin: 4px 0 0; }
    .times dt { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); }
    .times dd { margin: 0; font-weight: 600; }
    .actions { align-self: flex-start; }
  `,
})
export class RecipeHeaderComponent {
  readonly recipe = input.required<Recipe>();
  readonly shoppingOpen = input(false);
  readonly planningOpen = input(false);

  readonly shop = output<void>();
  readonly plan = output<void>();
  readonly remove = output<void>();
}
