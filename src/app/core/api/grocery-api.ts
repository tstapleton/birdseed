import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { GroceryItem, GroceryList, GroceryListSummary, NewGroceryItem } from './models';

@Injectable({ providedIn: 'root' })
export class GroceryApi {
  private readonly http = inject(HttpClient);

  lists(): Observable<GroceryListSummary[]> {
    return this.http.get<GroceryListSummary[]>('/api/grocery-lists');
  }

  get(id: string): Observable<GroceryList> {
    return this.http.get<GroceryList>(`/api/grocery-lists/${id}`);
  }

  create(name: string): Observable<GroceryList> {
    return this.http.post<GroceryList>('/api/grocery-lists', { name });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/grocery-lists/${id}`);
  }

  addItems(listId: string, items: NewGroceryItem[]): Observable<GroceryList> {
    return this.http.post<GroceryList>(`/api/grocery-lists/${listId}/items`, items);
  }

  updateItem(listId: string, itemId: string, patch: Partial<Omit<GroceryItem, 'id'>>): Observable<GroceryList> {
    return this.http.patch<GroceryList>(`/api/grocery-lists/${listId}/items/${itemId}`, patch);
  }

  removeItem(listId: string, itemId: string): Observable<GroceryList> {
    return this.http.delete<GroceryList>(`/api/grocery-lists/${listId}/items/${itemId}`);
  }

  clearChecked(listId: string): Observable<GroceryList> {
    return this.http.post<GroceryList>(`/api/grocery-lists/${listId}/clear-checked`, {});
  }
}
