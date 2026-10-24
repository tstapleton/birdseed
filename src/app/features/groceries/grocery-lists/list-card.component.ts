import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GroceryListSummary } from '../../../core/api/models';

/** A list's name, date and how much of it is in the basket. */
@Component({
  selector: 'app-list-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink],
  template: `
    @let l = list();
    <div class="list card">
      <a [routerLink]="['/groceries', l.id]">
        <span class="name">{{ l.name }}</span>
        <span class="muted">{{ l.createdAt | date: 'd MMM' }}</span>
      </a>
      <div class="progress" [attr.aria-label]="l.checkedCount + ' of ' + l.itemCount + ' in the basket'">
        <div class="bar"><div [style.width.%]="percent()"></div></div>
        <span class="muted">{{ l.checkedCount }}/{{ l.itemCount }}</span>
      </div>
    </div>
  `,
  styles: `
    .list { padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; position: relative; }
    a { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; text-decoration: none; color: var(--text); }
    a::after { content: ''; position: absolute; inset: 0; }
    .name { font-weight: 600; font-size: 16px; }
    .progress { display: flex; align-items: center; gap: 10px; font-size: 13px; }
    .bar { flex: 1; height: 6px; border-radius: 3px; background: var(--surface-2); overflow: hidden; }
    .bar div { height: 100%; background: var(--accent); }
  `,
})
export class ListCardComponent {
  readonly list = input.required<GroceryListSummary>();
  protected readonly percent = computed(() => (this.list().itemCount ? (100 * this.list().checkedCount) / this.list().itemCount : 0));
}
