import { Injectable, inject } from '@angular/core';
import { Recipe, RecipeDraft, RecipeSummary } from './models';
import { Transport } from './transport';

@Injectable({ providedIn: 'root' })
export class RecipesApi {
  private readonly transport = inject(Transport);

  list(): Promise<RecipeSummary[]> {
    return this.transport.send({ method: 'GET', path: '/recipes' });
  }

  get(id: string): Promise<Recipe> {
    return this.transport.send({ method: 'GET', path: `/recipes/${id}` });
  }

  create(draft: RecipeDraft): Promise<Recipe> {
    return this.transport.send({ method: 'POST', path: '/recipes', body: draft });
  }

  update(id: string, draft: RecipeDraft): Promise<Recipe> {
    return this.transport.send({ method: 'PUT', path: `/recipes/${id}`, body: draft });
  }

  setFavorite(id: string, favorite: boolean): Promise<RecipeSummary> {
    return this.transport.send({ method: 'PATCH', path: `/recipes/${id}`, body: { favorite } });
  }

  delete(id: string): Promise<void> {
    return this.transport.send({ method: 'DELETE', path: `/recipes/${id}` });
  }
}
