import { Injectable, inject } from '@angular/core';
import { Observable, concatMap, from, last, map, of, switchMap } from 'rxjs';
import { GroceryApi } from '../../../core/api/grocery-api';
import { GroceryList, NewGroceryItem } from '../../../core/api/models';
import { planMerge } from '../../../shared/kitchen/merge-items';

export interface AddResult {
  list: GroceryList;
  added: number;
  toppedUp: number;
}

/**
 * Adds items to a grocery list the way a person would: anything already on the list
 * (and not yet in the basket) is topped up rather than listed twice.
 */
@Injectable({ providedIn: 'root' })
export class GroceryAdder {
  private readonly api = inject(GroceryApi);

  addToList(listId: string, items: NewGroceryItem[]): Observable<AddResult> {
    return this.api.get(listId).pipe(
      switchMap((list) => {
        const plan = planMerge(list.items, items);
        const added$ = plan.add.length ? this.api.addItems(listId, plan.add) : of(list);
        return added$.pipe(
          switchMap((afterAdd) =>
            plan.update.length
              ? from(plan.update).pipe(
                  concatMap(({ id, patch }) => this.api.updateItem(listId, id, patch)),
                  last(),
                )
              : of(afterAdd),
          ),
          map((final) => ({ list: final, added: plan.add.length, toppedUp: plan.update.length })),
        );
      }),
    );
  }

  createList(name: string, items: NewGroceryItem[]): Observable<AddResult> {
    return this.api.create(name).pipe(switchMap((list) => this.addToList(list.id, items)));
  }
}
