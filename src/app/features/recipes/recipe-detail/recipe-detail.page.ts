import { ChangeDetectionStrategy, Component, OnInit, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfirmPanelComponent } from '../../../shared/ui/confirm-panel.component';
import { RecipeDetailStore } from '../data-access/recipe-detail.store';
import { IngredientsCardComponent } from './ingredients-card.component';
import { MethodCardComponent } from './method-card.component';
import { PlanPanelComponent } from './plan-panel.component';
import { RecipeHeaderComponent } from './recipe-header.component';
import { ShoppingPanelComponent } from './shopping-panel.component';

@Component({
  selector: 'app-recipe-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ConfirmPanelComponent, IngredientsCardComponent, MethodCardComponent, PlanPanelComponent, RecipeHeaderComponent, ShoppingPanelComponent],
  providers: [RecipeDetailStore],
  template: `
    <a class="back" routerLink="/recipes">← All recipes</a>

    @switch (store.status()) {
      @case ('loading') {
        <p class="empty" role="status">Loading recipe…</p>
      }
      @case ('missing') {
        <div class="empty" role="alert">
          <p>That recipe doesn't exist. It may have been deleted.</p>
          <a class="button" routerLink="/recipes">Back to recipes</a>
        </div>
      }
      @case ('error') {
        <div class="empty" role="alert">
          <p>The recipe could not be loaded.</p>
          <button type="button" (click)="store.load(id())">Try again</button>
        </div>
      }
    }

    @if (store.recipe(); as recipe) {
      <article aria-labelledby="title">
        <app-recipe-header
          [recipe]="recipe"
          [shoppingOpen]="store.shopping().open"
          [planningOpen]="store.planning().open"
          (shop)="store.shopping().open ? store.closeShopping() : store.openShopping()"
          (plan)="store.togglePlanning()"
          (remove)="store.askToDelete()"
        />

        @if (store.deletion() !== 'idle') {
          <app-confirm-panel
            [question]="'Delete ' + recipe.title + '?'"
            detail="It will also come off your meal plan. This can't be undone."
            confirmLabel="Delete recipe"
            [busy]="store.deletion() === 'deleting'"
            (confirmed)="store.delete()"
            (cancelled)="store.cancelDelete()"
          />
        }
        @if (store.shopping().open) {
          <app-shopping-panel />
        }
        @if (store.planning().open) {
          <app-plan-panel />
        }

        <div class="columns">
          <app-ingredients-card [ingredients]="store.ingredients()" [servings]="store.servings()" (servingsChange)="store.setServings($event)" />
          <app-method-card [steps]="recipe.steps" />
        </div>
      </article>
    }
  `,
  styles: `
    .back { display: inline-block; margin-bottom: 16px; text-decoration: none; font-weight: 500; }
    .columns { display: grid; gap: 16px; grid-template-columns: minmax(0, 2fr) minmax(0, 3fr); }
    @media (max-width: 760px) { .columns { grid-template-columns: 1fr; } }
    .empty { display: flex; flex-direction: column; align-items: center; gap: 12px; }
  `,
})
export class RecipeDetailPage implements OnInit {
  readonly id = input.required<string>();
  protected readonly store = inject(RecipeDetailStore);

  ngOnInit(): void {
    void this.store.load(this.id());
  }
}
