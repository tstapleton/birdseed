import { ChangeDetectionStrategy, Component, OnInit, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GroceryItem } from '../../../core/api/models';
import { formatAmount } from '../../../shared/kitchen/units';
import { GroceryListStore } from '../data-access/grocery-list.store';

@Component({
  selector: 'app-grocery-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  providers: [GroceryListStore],
  template: `
    <a class="back" routerLink="/groceries">← All lists</a>

    @if (store.status() === 'loading') {
      <p class="empty" role="status">Loading list…</p>
    } @else if (store.status() === 'missing') {
      <p class="empty" role="alert">That list doesn't exist.</p>
    }

    @if (store.list(); as list) {
      <div class="page-head">
        <div>
          <h1>{{ list.name }}</h1>
          <p>{{ store.progress().checked }} of {{ store.progress().total }} in the basket</p>
        </div>
        <div class="row">
          <button type="button" [attr.aria-pressed]="store.groupByAisle()" (click)="store.toggleGrouping()">Group by aisle</button>
          <button type="button" [disabled]="!store.progress().checked" (click)="store.clearChecked()">Clear basket</button>
          <button type="button" class="danger" (click)="store.askToDelete()">Delete list</button>
        </div>
      </div>

      @if (store.deletion() !== 'idle') {
        <div class="confirm card row" role="alertdialog" aria-labelledby="confirm-title">
          <p id="confirm-title"><strong>Delete {{ list.name }}?</strong> This can't be undone.</p>
          <span class="spacer"></span>
          <button type="button" class="danger solid" [disabled]="store.deletion() === 'deleting'" (click)="store.delete()">Delete</button>
          <button type="button" (click)="store.cancelDelete()">Cancel</button>
        </div>
      }

      <form class="add card card-body row" (submit)="$event.preventDefault(); add(item)" aria-label="Add to the list">
        <label for="new-item" class="visually-hidden">Items to add</label>
        <input id="new-item" #item placeholder="Add items, e.g. 2 kg potatoes, milk" autocomplete="off" />
        <button type="submit" class="primary">Add</button>
      </form>

      @for (section of store.sections(); track section.id) {
        <section class="section" [attr.aria-labelledby]="'section-' + section.id">
          <h2 [id]="'section-' + section.id">{{ section.title }}</h2>
          <ul class="items card" [attr.aria-label]="section.title">
            @for (item of section.items; track item.id) {
              <li [class.checked]="item.checked">
                <label>
                  <input type="checkbox" [checked]="item.checked" (change)="store.toggle(item.id)" />
                  <span><span class="amount">{{ amount(item) }}</span>&ngsp;{{ item.name }}</span>
                </label>
                @if (item.recipes.length) {
                  <span class="for muted">for {{ item.recipes.join(', ') }}</span>
                }
                <button type="button" class="icon" [attr.aria-label]="'Remove ' + item.name" (click)="store.remove(item.id)">×</button>
              </li>
            }
          </ul>
        </section>
      } @empty {
        <p class="empty">Nothing on this list yet.</p>
      }
    }
  `,
  styles: `
    .back { display: inline-block; margin-bottom: 16px; text-decoration: none; font-weight: 500; }
    .confirm { padding: 12px 16px; margin-bottom: 16px; border-color: var(--danger); background: var(--danger-soft); }
    .add { margin-bottom: 20px; flex-wrap: nowrap; }
    .add input { flex: 1; }
    .section { margin-bottom: 20px; }
    .section h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin-bottom: 8px; }
    .items { list-style: none; margin: 0; padding: 4px 0; max-width: 720px; }
    .items li { display: flex; align-items: center; gap: 10px; padding: 6px 8px 6px 16px; }
    .items li + li { border-top: 1px solid var(--border); }
    .items label { display: flex; align-items: center; gap: 10px; flex: 1; font-weight: 400; font-size: 15px; cursor: pointer; }
    .items input[type='checkbox'] { width: 18px; height: 18px; accent-color: var(--accent); }
    .amount { font-weight: 600; font-variant-numeric: tabular-nums; }
    .checked label { text-decoration: line-through; color: var(--muted); }
    .for { font-size: 12px; }
  `,
})
export class GroceryListPage implements OnInit {
  readonly id = input.required<string>();
  protected readonly store = inject(GroceryListStore);

  ngOnInit(): void {
    this.store.load(this.id());
  }

  protected amount(item: GroceryItem): string {
    return formatAmount(item);
  }

  protected add(input: HTMLInputElement): void {
    if (!input.value.trim()) return;
    this.store.addFromText(input.value);
    input.value = '';
  }
}
