import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { GroceryListsStore } from '../data-access/grocery-lists.store';

@Component({
  selector: 'app-new-list-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="create card card-body row" aria-label="New list" (submit)="$event.preventDefault(); create(name)">
      <label for="list-name" class="visually-hidden">List name</label>
      <input id="list-name" #name placeholder="New list, e.g. Weekend BBQ" required />
      <button type="submit" class="primary" [disabled]="store.creating()">Create list</button>
    </form>
  `,
  styles: `
    .create { margin-bottom: 20px; flex-wrap: nowrap; }
    .create input { flex: 1; }
  `,
})
export class NewListFormComponent {
  protected readonly store = inject(GroceryListsStore);

  protected create(input: HTMLInputElement): void {
    if (!input.value.trim()) return;
    void this.store.create(input.value);
    input.value = '';
  }
}
