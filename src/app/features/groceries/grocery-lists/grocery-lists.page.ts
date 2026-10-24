import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GroceryListsStore } from '../data-access/grocery-lists.store';

@Component({
  selector: 'app-grocery-lists-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe],
  providers: [GroceryListsStore],
  template: `
    <div class="page-head">
      <div>
        <h1>Grocery lists</h1>
        <p>Add things as you think of them, or straight from a recipe or your meal plan.</p>
      </div>
    </div>

    <form class="create card card-body row" (submit)="$event.preventDefault(); create(name)" aria-label="New list">
      <label for="list-name" class="visually-hidden">List name</label>
      <input id="list-name" #name placeholder="New list, e.g. Weekend BBQ" required />
      <button type="submit" class="primary" [disabled]="store.creating()">Create list</button>
    </form>

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
              <li class="card">
                <a [routerLink]="['/groceries', list.id]">
                  <span class="name">{{ list.name }}</span>
                  <span class="muted">{{ list.createdAt | date: 'd MMM' }}</span>
                </a>
                <div class="progress" [attr.aria-label]="list.checkedCount + ' of ' + list.itemCount + ' in the basket'">
                  <div class="bar"><div [style.width.%]="list.itemCount ? (100 * list.checkedCount) / list.itemCount : 0"></div></div>
                  <span class="muted">{{ list.checkedCount }}/{{ list.itemCount }}</span>
                </div>
              </li>
            }
          </ul>
        } @else {
          <p class="empty">No lists yet. Create one above.</p>
        }
      }
    }
  `,
  styles: `
    .create { margin-bottom: 20px; flex-wrap: nowrap; }
    .create input { flex: 1; }
    .lists { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
    .lists li { padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; position: relative; }
    .lists a { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; text-decoration: none; color: var(--text); }
    .lists a::after { content: ''; position: absolute; inset: 0; }
    .name { font-weight: 600; font-size: 16px; }
    .progress { display: flex; align-items: center; gap: 10px; font-size: 13px; }
    .bar { flex: 1; height: 6px; border-radius: 3px; background: var(--surface-2); overflow: hidden; }
    .bar div { height: 100%; background: var(--accent); }
  `,
})
export class GroceryListsPage {
  protected readonly store = inject(GroceryListsStore);

  protected create(input: HTMLInputElement): void {
    if (!input.value.trim()) return;
    this.store.create(input.value);
    input.value = '';
  }
}
