import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { Clock } from '../time/clock';
import { MockDatabase, NotFoundError } from './mock-database';

let database: MockDatabase | undefined;

/**
 * Answers `/api/*` requests from an in-memory database, so the app runs without a
 * server. Responses arrive after a short delay, like a real network would.
 */
export const mockBackendInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api/')) return next(req);
  database ??= new MockDatabase(globalThis.localStorage, inject(Clock).today());
  return respond(database, req).pipe(delay(150 + Math.random() * 200));
};

function respond(db: MockDatabase, req: HttpRequest<unknown>): Observable<HttpResponse<unknown>> {
  const path = req.url.replace(/^\/api\//, '').split('/');
  const body = req.body as never;
  try {
    return ok(route(db, req.method, path, body, req));
  } catch (error) {
    const status = error instanceof NotFoundError ? 404 : 500;
    return throwError(() => new HttpErrorResponse({ status, url: req.url, error: String(error) }));
  }
}

function route(db: MockDatabase, method: string, [resource, id, sub, subId]: string[], body: never, req: HttpRequest<unknown>): unknown {
  switch (`${method} ${resource}${id ? '/:id' : ''}${sub ? `/${sub}` : ''}${subId ? '/:subId' : ''}`) {
    case 'GET recipes':
      return db.listRecipes();
    case 'POST recipes':
      return db.createRecipe(body);
    case 'GET recipes/:id':
      return db.getRecipe(id!);
    case 'PUT recipes/:id':
    case 'PATCH recipes/:id':
      return db.updateRecipe(id!, body);
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
      return db.addGroceryItems(id!, body);
    case 'PATCH grocery-lists/:id/items/:subId':
      return db.updateGroceryItem(id!, subId!, body);
    case 'DELETE grocery-lists/:id/items/:subId':
      return db.removeGroceryItem(id!, subId!);
    case 'POST grocery-lists/:id/clear-checked':
      return db.clearChecked(id!);

    case 'GET meal-plan':
      return db.mealsBetween(req.params.get('from')!, req.params.get('to')!);
    case 'POST meal-plan':
      return db.addMeal(body);
    case 'PATCH meal-plan/:id':
      return db.updateMeal(id!, body);
    case 'DELETE meal-plan/:id':
      return db.removeMeal(id!);
  }
  throw new NotFoundError(`${method} ${req.url}`);
}

function ok(body: unknown): Observable<HttpResponse<unknown>> {
  return of(new HttpResponse({ status: 200, body: structuredClone(body ?? null) }));
}
