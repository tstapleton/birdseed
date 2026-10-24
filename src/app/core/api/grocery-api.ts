import { Injectable, inject } from '@angular/core';
import { GroceryItem, GroceryList, GroceryListSummary, NewGroceryItem } from './models';
import { Transport } from './transport';

@Injectable({ providedIn: 'root' })
export class GroceryApi {
  private readonly transport = inject(Transport);

  lists(): Promise<GroceryListSummary[]> {
    return this.transport.send({ method: 'GET', path: '/grocery-lists' });
  }

  get(id: string): Promise<GroceryList> {
    return this.transport.send({ method: 'GET', path: `/grocery-lists/${id}` });
  }

  create(name: string): Promise<GroceryList> {
    return this.transport.send({ method: 'POST', path: '/grocery-lists', body: { name } });
  }

  delete(id: string): Promise<void> {
    return this.transport.send({ method: 'DELETE', path: `/grocery-lists/${id}` });
  }

  addItems(listId: string, items: NewGroceryItem[]): Promise<GroceryList> {
    return this.transport.send({ method: 'POST', path: `/grocery-lists/${listId}/items`, body: items });
  }

  updateItem(listId: string, itemId: string, patch: Partial<Omit<GroceryItem, 'id'>>): Promise<GroceryList> {
    return this.transport.send({ method: 'PATCH', path: `/grocery-lists/${listId}/items/${itemId}`, body: patch });
  }

  removeItem(listId: string, itemId: string): Promise<GroceryList> {
    return this.transport.send({ method: 'DELETE', path: `/grocery-lists/${listId}/items/${itemId}` });
  }

  clearChecked(listId: string): Promise<GroceryList> {
    return this.transport.send({ method: 'POST', path: `/grocery-lists/${listId}/clear-checked` });
  }
}
