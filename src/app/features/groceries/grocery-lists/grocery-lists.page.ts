import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { GroceryListsStore } from '../data-access/grocery-lists.store';
import { ListCardComponent } from './list-card.component';
import { NewListFormComponent } from './new-list-form.component';

@Component({
  selector: 'app-grocery-lists-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ListCardComponent, NewListFormComponent],
  providers: [GroceryListsStore],
  template: `
    <div class="page-head">
      <div>
        <h1>Grocery lists</h1>
        <p>Add things as you think of them, or straight from a recipe or your meal plan.</p>
      </div>
    </div>

    <app-new-list-form />

    @switch (store.status()) {
      @case ('loading') {
        <p class="empty" role="status">Loading lists…</p>
      }
      @case ('error') {
        <p class="empty" role="alert">Lists could not be loaded.</p>
      }
      @default {
        @if (store.lists().length) {
          <ul class="lists" aria-label="Grocery lists">
            @for (list of store.lists(); track list.id) {
              <li><app-list-card [list]="list" /></li>
            }
          </ul>
        } @else {
          <p class="empty">No lists yet. Create one above.</p>
        }
      }
    }
  `,
  styles: `
    .lists { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
  `,
})
export class GroceryListsPage {
  protected readonly store = inject(GroceryListsStore);
}
