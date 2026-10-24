import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { RecipeDetailStore } from '../data-access/recipe-detail.store';

/** Adds the recipe's ingredients to an existing or new grocery list. */
@Component({
  selector: 'app-shopping-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="panel card card-body" aria-label="Add to grocery list" (submit)="$event.preventDefault(); add()">
      @if (store.shopping().status === 'loading') {
        <p role="status">Loading your lists…</p>
      } @else {
        <div class="row">
          <div class="field">
            <label for="list-choice">Grocery list</label>
            <select id="list-choice" (change)="choice.set($any($event.target).value)">
              @for (list of store.shopping().lists; track list.id) {
                <option [value]="list.id" [selected]="list.id === choice()">{{ list.name }}</option>
              }
              <option value="new" [selected]="choice() === 'new'">New list…</option>
            </select>
          </div>
          @if (choice() === 'new') {
            <div class="field">
              <label for="new-list-name">New list name</label>
              <input id="new-list-name" [value]="newListName() || store.recipe()?.title" (input)="newListName.set($any($event.target).value)" />
            </div>
          }
        </div>
        <p class="muted">Adds {{ store.ingredients().length }} ingredients for {{ store.servings() }} servings. Anything already on the list is topped up.</p>
        <div class="row">
          <button type="submit" class="primary" [disabled]="store.shopping().status === 'adding'">Add ingredients</button>
          <button type="button" (click)="store.closeShopping()">Cancel</button>
        </div>
      }
    </form>
  `,
  styles: `
    .panel { margin-bottom: 20px; display: flex; flex-direction: column; gap: 12px; }
    .panel .row { align-items: flex-end; }
  `,
})
export class ShoppingPanelComponent {
  protected readonly store = inject(RecipeDetailStore);
  /** The list picked: a list id, or 'new'. */
  protected readonly choice = signal('new');
  protected readonly newListName = signal('');

  constructor() {
    // Default to the newest list once they've loaded.
    effect(() => {
      const { status, lists } = this.store.shopping();
      if (status === 'ready') this.choice.set(lists[0]?.id ?? 'new');
    });
  }

  protected add(): void {
    const choice = this.choice();
    void this.store.addToGroceryList(choice === 'new' ? { newListName: this.newListName() || this.store.recipe()!.title } : { listId: choice });
  }
}
