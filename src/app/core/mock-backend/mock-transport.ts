import { Injectable, inject } from '@angular/core';
import { ApiError, Request, Transport } from '../api/transport';
import { Clock } from '../time/clock';
import { MockDatabase, NotFoundError } from './mock-database';

/**
 * Answers API requests from an in-memory database, so the app runs without a server.
 * Responses arrive after a short delay, like a real network's would.
 */
@Injectable({ providedIn: 'root' })
export class MockTransport extends Transport {
  private readonly db = new MockDatabase(globalThis.localStorage, inject(Clock).today());

  async send<T>(request: Request): Promise<T> {
    await new Promise((resolve) => setTimeout(resolve, 150 + Math.random() * 200));
    try {
      return structuredClone(route(this.db, request) ?? null) as T;
    } catch (error) {
      throw new ApiError(error instanceof NotFoundError ? 404 : 500, String(error));
    }
  }
}

function route(db: MockDatabase, { method, path, query, body }: Request): unknown {
  const [, resource, id, sub, subId] = path.split('/');
  const payload = body as never;
  switch (`${method} ${resource}${id ? '/:id' : ''}${sub ? `/${sub}` : ''}${subId ? '/:subId' : ''}`) {
    case 'GET recipes':
      return db.listRecipes();
    case 'POST recipes':
      return db.createRecipe(payload);
    case 'GET recipes/:id':
      return db.getRecipe(id!);
    case 'PUT recipes/:id':
    case 'PATCH recipes/:id':
      return db.updateRecipe(id!, payload);
    case 'DELETE recipes/:id':
      return db.deleteRecipe(id!);

    case 'GET grocery-lists':
      return db.listGroceryLists();
    case 'POST grocery-lists':
      return db.createGroceryList((body as { name: string }).name);
    case 'GET grocery-lists/:id':
      return db.getGroceryList(id!);
    case 'DELETE grocery-lists/:id':
      return db.deleteGroceryList(id!);
    case 'POST grocery-lists/:id/items':
      return db.addGroceryItems(id!, payload);
    case 'PATCH grocery-lists/:id/items/:subId':
      return db.updateGroceryItem(id!, subId!, payload);
    case 'DELETE grocery-lists/:id/items/:subId':
      return db.removeGroceryItem(id!, subId!);
    case 'POST grocery-lists/:id/clear-checked':
      return db.clearChecked(id!);

    case 'GET meal-plan':
      return db.mealsBetween(query!['from']!, query!['to']!);
    case 'POST meal-plan':
      return db.addMeal(payload);
    case 'PATCH meal-plan/:id':
      return db.updateMeal(id!, payload);
    case 'DELETE meal-plan/:id':
      return db.removeMeal(id!);
  }
  throw new NotFoundError(`${method} ${path}`);
}
