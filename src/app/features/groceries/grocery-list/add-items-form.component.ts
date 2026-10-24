import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { GroceryListStore } from '../data-access/grocery-list.store';

/** Free-text adding: "2 kg potatoes, milk". */
@Component({
  selector: 'app-add-items-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="add card card-body row" aria-label="Add to the list" (submit)="$event.preventDefault(); add(item)">
      <label for="new-item" class="visually-hidden">Items to add</label>
      <input id="new-item" #item placeholder="Add items, e.g. 2 kg potatoes, milk" autocomplete="off" />
      <button type="submit" class="primary">Add</button>
    </form>
  `,
  styles: `
    .add { margin-bottom: 20px; flex-wrap: nowrap; }
    .add input { flex: 1; }
  `,
})
export class AddItemsFormComponent {
  private readonly store = inject(GroceryListStore);

  protected add(input: HTMLInputElement): void {
    if (!input.value.trim()) return;
    void this.store.addFromText(input.value);
    input.value = '';
  }
}
