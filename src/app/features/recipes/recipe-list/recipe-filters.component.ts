import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RecipesStore } from '../data-access/recipes.store';

/** Search and tag filters for the collection. */
@Component({
  selector: 'app-recipe-filters',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="filters">
      <input
        type="search"
        aria-label="Search recipes"
        placeholder="Search by name, description or tag"
        [value]="store.search()"
        (input)="store.setSearch($any($event.target).value)"
      />
      <div class="row" role="group" aria-label="Filter by tag">
        <button type="button" class="chip" [attr.aria-pressed]="store.favoritesOnly()" (click)="store.toggleFavoritesOnly()">★ Favourites</button>
        @for (tag of store.tags(); track tag) {
          <button type="button" class="chip" [attr.aria-pressed]="store.selectedTags().includes(tag)" (click)="store.toggleTag(tag)">{{ tag }}</button>
        }
      </div>
    </div>
  `,
  styles: `
    .filters { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
    .filters input { max-width: 420px; }
  `,
})
export class RecipeFiltersComponent {
  protected readonly store = inject(RecipesStore);
}
