import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { withTracing } from '@tstapleton/plotline/store';
import { EMPTY, catchError, exhaustMap, pipe, switchMap, tap } from 'rxjs';
import { GroceryApi } from '../../../core/api/grocery-api';
import { MealPlanApi } from '../../../core/api/meal-plan-api';
import { GroceryListSummary, Ingredient, Meal, Recipe } from '../../../core/api/models';
import { fromIsoDate } from '../../../core/time/dates';
import { RecipesApi } from '../../../core/api/recipes-api';
import { Toaster } from '../../../core/notifications/toaster';
import { aisleFor } from '../../../shared/kitchen/aisles';
import { formatAmount, scale } from '../../../shared/kitchen/units';
import { GroceryAdder } from '../../groceries/data-access/grocery-adder';

interface RecipeDetailState {
  recipe: Recipe | null;
  status: 'loading' | 'loaded' | 'missing' | 'error';
  servings: number;
  deletion: 'idle' | 'confirming' | 'deleting';
  /** The "add to grocery list" panel. */
  shopping: { open: boolean; status: 'loading' | 'ready' | 'adding'; lists: GroceryListSummary[] };
  /** The "add to meal plan" panel. */
  planning: { open: boolean; saving: boolean };
}

const initialState: RecipeDetailState = {
  recipe: null,
  status: 'loading',
  servings: 1,
  deletion: 'idle',
  shopping: { open: false, status: 'loading', lists: [] },
  planning: { open: false, saving: false },
};

/** Which list to add a recipe's ingredients to. */
export type ShoppingTarget = { listId: string } | { newListName: string };

export interface ScaledIngredient {
  name: string;
  amount: string;
  note?: string;
}

/** One recipe, scaled to the number of servings being cooked. */
export const RecipeDetailStore = signalStore(
  withState(initialState),
  withComputed((store) => {
    const factor = computed(() => store.servings() / (store.recipe()?.servings ?? 1));
    const scaled = computed<Ingredient[]>(() => (store.recipe()?.ingredients ?? []).map((i) => ({ ...i, ...scale(i, factor()) })));
    return {
      factor,
      scaled,
      ingredients: computed<ScaledIngredient[]>(() => scaled().map((i) => ({ name: i.name, amount: formatAmount(i), note: i.note }))),
      totalMinutes: computed(() => (store.recipe()?.prepMinutes ?? 0) + (store.recipe()?.cookMinutes ?? 0)),
    };
  }),
  withMethods(
    (
      store,
      api = inject(RecipesApi),
      groceryApi = inject(GroceryApi),
      mealPlanApi = inject(MealPlanApi),
      adder = inject(GroceryAdder),
      toaster = inject(Toaster),
      router = inject(Router),
    ) => ({
    load: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { status: 'loading', recipe: null, deletion: 'idle' })),
        switchMap((id) =>
          api.get(id).pipe(
            tap((recipe) => patchState(store, { recipe, servings: recipe.servings, status: 'loaded' })),
            catchError((error: { status?: number }) => {
              patchState(store, { status: error.status === 404 ? 'missing' : 'error' });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),

    setServings(servings: number): void {
      patchState(store, { servings: Math.min(99, Math.max(1, Math.round(servings))) });
    },

    askToDelete(): void {
      patchState(store, { deletion: 'confirming' });
    },

    cancelDelete(): void {
      patchState(store, { deletion: 'idle' });
    },

    delete: rxMethod<void>(
      exhaustMap(() => {
        const recipe = store.recipe();
        if (!recipe) return EMPTY;
        patchState(store, { deletion: 'deleting' });
        return api.delete(recipe.id).pipe(
          tap(() => {
            toaster.success(`Deleted ${recipe.title}`);
            void router.navigateByUrl('/recipes');
          }),
          catchError(() => {
            patchState(store, { deletion: 'idle' });
            toaster.error(`Couldn't delete ${recipe.title}`);
            return EMPTY;
          }),
        );
      }),
    ),

    openShopping: rxMethod<void>(
      switchMap(() => {
        patchState(store, { shopping: { open: true, status: 'loading', lists: [] } });
        return groceryApi.lists().pipe(
          tap((lists) => patchState(store, { shopping: { open: true, status: 'ready', lists } })),
          catchError(() => {
            patchState(store, { shopping: { open: true, status: 'ready', lists: [] } });
            return EMPTY;
          }),
        );
      }),
    ),

    closeShopping(): void {
      patchState(store, { shopping: { ...store.shopping(), open: false } });
    },

    /** Adds the ingredients, scaled to the servings shown, to a list. */
    addToGroceryList: rxMethod<ShoppingTarget>(
      exhaustMap((target) => {
        const recipe = store.recipe()!;
        const items = store.scaled().map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unit: i.unit,
          aisle: aisleFor(i.name),
          recipes: [recipe.title],
        }));
        patchState(store, { shopping: { ...store.shopping(), status: 'adding' } });
        const adding = 'listId' in target ? adder.addToList(target.listId, items) : adder.createList(target.newListName.trim(), items);
        return adding.pipe(
          tap(({ list }) => {
            patchState(store, { shopping: { ...store.shopping(), open: false, status: 'ready' } });
            toaster.success(`Added ${recipe.title} to ${list.name}`);
          }),
          catchError(() => {
            patchState(store, { shopping: { ...store.shopping(), status: 'ready' } });
            toaster.error(`Couldn't add ${recipe.title} to the list`);
            return EMPTY;
          }),
        );
      }),
    ),

    togglePlanning(): void {
      patchState(store, { planning: { open: !store.planning().open, saving: false } });
    },

    /** Plans this recipe, at the servings shown, for a day and meal. */
    addToPlan: rxMethod<{ date: string; meal: Meal }>(
      exhaustMap(({ date, meal }) => {
        const recipe = store.recipe()!;
        patchState(store, { planning: { open: true, saving: true } });
        return mealPlanApi.add({ date, meal, recipeId: recipe.id, recipeTitle: recipe.title, servings: store.servings() }).pipe(
          tap(() => {
            patchState(store, { planning: { open: false, saving: false } });
            const day = fromIsoDate(date).toLocaleDateString('en-GB', { weekday: 'long' });
            toaster.success(`Planned ${recipe.title} for ${day} ${meal}`);
          }),
          catchError(() => {
            patchState(store, { planning: { open: true, saving: false } });
            toaster.error(`Couldn't plan ${recipe.title}`);
            return EMPTY;
          }),
        );
      }),
    ),
  })),
  withTracing('Recipe store'),
);
