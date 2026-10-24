import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Recipe, RecipeDraft, RecipeSummary } from './models';

@Injectable({ providedIn: 'root' })
export class RecipesApi {
  private readonly http = inject(HttpClient);

  list(): Observable<RecipeSummary[]> {
    return this.http.get<RecipeSummary[]>('/api/recipes');
  }

  get(id: string): Observable<Recipe> {
    return this.http.get<Recipe>(`/api/recipes/${id}`);
  }

  create(draft: RecipeDraft): Observable<Recipe> {
    return this.http.post<Recipe>('/api/recipes', draft);
  }

  update(id: string, draft: RecipeDraft): Observable<Recipe> {
    return this.http.put<Recipe>(`/api/recipes/${id}`, draft);
  }

  setFavorite(id: string, favorite: boolean): Observable<RecipeSummary> {
    return this.http.patch<RecipeSummary>(`/api/recipes/${id}`, { favorite });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/recipes/${id}`);
  }
}
