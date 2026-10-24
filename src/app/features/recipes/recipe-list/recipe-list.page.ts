import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RecipesStore } from '../data-access/recipes.store';
import { RecipeCardComponent } from './recipe-card.component';
import { RecipeFiltersComponent } from './recipe-filters.component';

@Component({
  selector: 'app-recipe-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RecipeCardComponent, RecipeFiltersComponent],
  providers: [RecipesStore],
  template: `
    <div class="page-head">
      <div>
        <h1>Recipes</h1>
        @if (store.status() === 'loaded') {
          <p>{{ store.recipes().length }} recipes in your collection</p>
        }
      </div>
      <a class="button primary" routerLink="/recipes/new">New recipe</a>
    </div>

    <app-recipe-filters />

    @switch (store.status()) {
      @case ('loading') {
        <p class="empty" role="status">Loading recipes…</p>
      }
      @case ('error') {
        <div class="empty" role="alert">
          <p>Recipes could not be loaded.</p>
          <button type="button" (click)="store.load()">Try again</button>
        </div>
      }
      @case ('loaded') {
        @if (store.visible().length) {
          <ul class="grid" aria-label="Recipes">
            @for (recipe of store.visible(); track recipe.id) {
              <li><app-recipe-card [recipe]="recipe" (favoriteToggled)="store.toggleFavorite(recipe.id)" /></li>
            }
          </ul>
        } @else if (store.filtered()) {
          <div class="empty">
            <p>No recipes match these filters.</p>
            <button type="button" (click)="store.clearFilters()">Clear filters</button>
          </div>
        } @else {
          <div class="empty">
            <p>No recipes yet.</p>
            <a class="button primary" routerLink="/recipes/new">Add your first recipe</a>
          </div>
        }
      }
    }
  `,
  styles: `
    .grid { list-style: none; padding: 0; margin: 0; display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
    .empty { display: flex; flex-direction: column; align-items: center; gap: 12px; }
  `,
})
export class RecipeListPage {
  protected readonly store = inject(RecipesStore);
}
