import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { GroceryItem } from '../../../core/api/models';
import { formatAmount } from '../../../shared/kitchen/units';
import { ItemSection } from '../data-access/grocery-list.store';

/** One aisle (or the basket) of a grocery list. */
@Component({
  selector: 'app-item-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let s = section();
    <section class="section" [attr.aria-labelledby]="'section-' + s.id">
      <h2 [id]="'section-' + s.id">{{ s.title }}</h2>
      <ul class="items card" [attr.aria-label]="s.title">
        @for (item of s.items; track item.id) {
          <li [class.checked]="item.checked">
            <label>
              <input type="checkbox" [checked]="item.checked" (change)="toggled.emit(item.id)" />
              <span><span class="amount">{{ amount(item) }}</span>&ngsp;{{ item.name }}</span>
            </label>
            @if (item.recipes.length) {
              <span class="for muted">for {{ item.recipes.join(', ') }}</span>
            }
            <button type="button" class="icon" [attr.aria-label]="'Remove ' + item.name" (click)="removed.emit(item.id)">×</button>
          </li>
        }
      </ul>
    </section>
  `,
  styles: `
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
export class ItemSectionComponent {
  readonly section = input.required<ItemSection>();
  readonly toggled = output<string>();
  readonly removed = output<string>();

  protected amount(item: GroceryItem): string {
    return formatAmount(item);
  }
}
