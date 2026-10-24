import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { render } from '@testing-library/angular';
import { provideTracing, recordPlotline, traced } from '@tstapleton/plotline/jest';
import userEvent from '@testing-library/user-event';
import { App } from '../app/app';
import { routes } from '../app/app.routes';
import { GroceryApi } from '../app/core/api/grocery-api';
import { MealPlanApi } from '../app/core/api/meal-plan-api';
import { RecipesApi } from '../app/core/api/recipes-api';
import { ApiError } from '../app/core/api/transport';
import { MockDatabase, NotFoundError } from '../app/core/mock-backend/mock-database';
import { Toaster } from '../app/core/notifications/toaster';
import { Clock } from '../app/core/time/clock';
import { GroceryAdder } from '../app/features/groceries/data-access/grocery-adder';

// Every spec that renders the app through this helper is recorded (with PLOTLINE=1).
recordPlotline();

/** Tests run on Wednesday 15 April 2026. */
export const TODAY = new Date(2026, 3, 15);

// Diagram boxes: the app's own code, and the host services it talks to (mocked).
const APP = 'Birdseed app';
const HOST = 'Backend and host services (mocked)';

/**
 * Like the real backend, but in memory and answering a few milliseconds later. Errors
 * from the database surface as API errors, as they would from the server.
 */
function respond<T>(answer: () => T): Promise<T> {
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      try {
        resolve(structuredClone(answer()));
      } catch (error) {
        reject(new ApiError(error instanceof NotFoundError ? 404 : 500, String(error)));
      }
    }, 5),
  );
}

/** Ids count up and the clock stands still, so every run records the same data. */
function predictableSources() {
  let next = 1;
  return { newId: (prefix: string) => `${prefix}-new-${next++}`, now: () => new Date(TODAY) };
}

export function createBackend(db = new MockDatabase(undefined, TODAY, predictableSources())) {
  const recipes = {
    list: jest.fn(() => respond(() => db.listRecipes())),
    get: jest.fn((id: string) => respond(() => db.getRecipe(id))),
    create: jest.fn((draft: Parameters<MockDatabase['createRecipe']>[0]) => respond(() => db.createRecipe(draft))),
    update: jest.fn((id: string, draft: Parameters<MockDatabase['createRecipe']>[0]) => respond(() => db.updateRecipe(id, draft))),
    setFavorite: jest.fn((id: string, favorite: boolean) => respond(() => db.updateRecipe(id, { favorite }))),
    delete: jest.fn((id: string) => respond(() => db.deleteRecipe(id))),
  };
  const groceries = {
    lists: jest.fn(() => respond(() => db.listGroceryLists())),
    get: jest.fn((id: string) => respond(() => db.getGroceryList(id))),
    create: jest.fn((name: string) => respond(() => db.createGroceryList(name))),
    delete: jest.fn((id: string) => respond(() => db.deleteGroceryList(id))),
    addItems: jest.fn((listId: string, items: Parameters<MockDatabase['addGroceryItems']>[1]) => respond(() => db.addGroceryItems(listId, items))),
    updateItem: jest.fn((listId: string, itemId: string, patch: object) => respond(() => db.updateGroceryItem(listId, itemId, patch))),
    removeItem: jest.fn((listId: string, itemId: string) => respond(() => db.removeGroceryItem(listId, itemId))),
    clearChecked: jest.fn((listId: string) => respond(() => db.clearChecked(listId))),
  };
  const mealPlan = {
    range: jest.fn((from: string, to: string) => respond(() => db.mealsBetween(from, to))),
    add: jest.fn((meal: Parameters<MockDatabase['addMeal']>[0]) => respond(() => db.addMeal(meal))),
    update: jest.fn((id: string, patch: Parameters<MockDatabase['updateMeal']>[1]) => respond(() => db.updateMeal(id, patch))),
    remove: jest.fn((id: string) => respond(() => db.removeMeal(id))),
  };
  const toaster = { success: jest.fn(), error: jest.fn(), dismiss: jest.fn(), toasts: () => [] };
  return { db, recipes, groceries, mealPlan, toaster };
}

export type Backend = ReturnType<typeof createBackend>;

/** Renders the whole app at `url`, with the host's services mocked. */
export async function renderApp(url: string, backend: Backend = createBackend()) {
  await render(App, {
    // Start at `url`; otherwise the router first visits '/' (and loads the recipes).
    initialRoute: url,
    providers: [
      provideRouter(routes, withComponentInputBinding()),
      traced('Recipes API', { provide: RecipesApi, useValue: backend.recipes }, { group: HOST }),
      traced('Grocery API', { provide: GroceryApi, useValue: backend.groceries }, { group: HOST }),
      traced('Meal plan API', { provide: MealPlanApi, useValue: backend.mealPlan }, { group: HOST }),
      traced('Toaster', { provide: Toaster, useValue: backend.toaster }, { group: HOST, methods: ['success', 'error'] }),
      traced('Grocery adder', GroceryAdder, { group: APP }),
      { provide: Clock, useValue: { today: () => new Date(TODAY) } },
      provideTracing({ ui: 'UI', group: APP }),
    ],
  });
  return { ...backend, user: userEvent.setup(), router: TestBed.inject(Router) };
}
