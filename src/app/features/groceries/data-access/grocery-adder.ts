import { Injectable, inject } from '@angular/core';
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

  async addToList(listId: string, items: NewGroceryItem[]): Promise<AddResult> {
    let list = await this.api.get(listId);
    const plan = planMerge(list.items, items);
    if (plan.add.length) list = await this.api.addItems(listId, plan.add);
    for (const { id, patch } of plan.update) list = await this.api.updateItem(listId, id, patch);
    return { list, added: plan.add.length, toppedUp: plan.update.length };
  }

  async createList(name: string, items: NewGroceryItem[]): Promise<AddResult> {
    const list = await this.api.create(name);
    return this.addToList(list.id, items);
  }
}
