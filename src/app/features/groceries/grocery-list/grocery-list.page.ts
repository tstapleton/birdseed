import { ChangeDetectionStrategy, Component, OnInit, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfirmPanelComponent } from '../../../shared/ui/confirm-panel.component';
import { GroceryListStore } from '../data-access/grocery-list.store';
import { AddItemsFormComponent } from './add-items-form.component';
import { ItemSectionComponent } from './item-section.component';

@Component({
  selector: 'app-grocery-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AddItemsFormComponent, ConfirmPanelComponent, ItemSectionComponent],
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
        <app-confirm-panel
          [question]="'Delete ' + list.name + '?'"
          detail="This can't be undone."
          [busy]="store.deletion() === 'deleting'"
          (confirmed)="store.delete()"
          (cancelled)="store.cancelDelete()"
        />
      }

      <app-add-items-form />

      @for (section of store.sections(); track section.id) {
        <app-item-section [section]="section" (toggled)="store.toggle($event)" (removed)="store.remove($event)" />
      } @empty {
        <p class="empty">Nothing on this list yet.</p>
      }
    }
  `,
  styles: `
    .back { display: inline-block; margin-bottom: 16px; text-decoration: none; font-weight: 500; }
  `,
})
export class GroceryListPage implements OnInit {
  readonly id = input.required<string>();
  protected readonly store = inject(GroceryListStore);

  ngOnInit(): void {
    void this.store.load(this.id());
  }
}
