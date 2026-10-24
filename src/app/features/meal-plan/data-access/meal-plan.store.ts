import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { withTracing } from '@tstapleton/plotline/store';
import { EMPTY, catchError, exhaustMap, forkJoin, map, mergeMap, pipe, switchMap, tap } from 'rxjs';
import { MealPlanApi } from '../../../core/api/meal-plan-api';
import { MEALS, Meal, NewGroceryItem, PlannedMeal, Recipe, RecipeSummary } from '../../../core/api/models';
import { RecipesApi } from '../../../core/api/recipes-api';
import { Toaster } from '../../../core/notifications/toaster';
import { Clock } from '../../../core/time/clock';
import { addDays, fromIsoDate, startOfWeek, toIsoDate } from '../../../core/time/dates';
import { aisleFor } from '../../../shared/kitchen/aisles';
import { scale } from '../../../shared/kitchen/units';
import { GroceryAdder } from '../../groceries/data-access/grocery-adder';

export interface PlanDay {
  date: string;
  today: boolean;
  meals: Record<Meal, PlannedMeal[]>;
}

export interface Slot {
  date: string;
  meal: Meal;
}

interface MealPlanState {
  weekStart: string;
  meals: PlannedMeal[];
  recipes: RecipeSummary[];
  status: 'loading' | 'loaded' | 'error';
  /** The slot whose recipe picker is open. */
  adding: Slot | null;
  generating: boolean;
}

/** A week of planned meals, Monday to Sunday. */
export const MealPlanStore = signalStore(
  withState<MealPlanState>({ weekStart: '', meals: [], recipes: [], status: 'loading', adding: null, generating: false }),
  withComputed((store, clock = inject(Clock)) => ({
    days: computed<PlanDay[]>(() => {
      if (!store.weekStart()) return [];
      const today = toIsoDate(clock.today());
      return Array.from({ length: 7 }, (_, i) => {
        const date = toIsoDate(addDays(fromIsoDate(store.weekStart()), i));
        const meals = Object.fromEntries(MEALS.map((m) => [m, store.meals().filter((p) => p.date === date && p.meal === m)])) as Record<Meal, PlannedMeal[]>;
        return { date, today: date === today, meals };
      });
    }),
    weekEnd: computed(() => (store.weekStart() ? toIsoDate(addDays(fromIsoDate(store.weekStart()), 6)) : '')),
    isThisWeek: computed(() => store.weekStart() === toIsoDate(startOfWeek(clock.today()))),
  })),
  withMethods(
    (
      store,
      api = inject(MealPlanApi),
      recipesApi = inject(RecipesApi),
      adder = inject(GroceryAdder),
      toaster = inject(Toaster),
      clock = inject(Clock),
      router = inject(Router),
    ) => {
      const replace = (meal: PlannedMeal) => patchState(store, { meals: store.meals().map((m) => (m.id === meal.id ? meal : m)) });

      const loadWeek = rxMethod<string>(
        pipe(
          tap((weekStart) => patchState(store, { weekStart, status: 'loading', adding: null })),
          switchMap((weekStart) =>
            api.range(weekStart, toIsoDate(addDays(fromIsoDate(weekStart), 6))).pipe(
              tap((meals) => patchState(store, { meals, status: 'loaded' })),
              catchError(() => {
                patchState(store, { status: 'error' });
                return EMPTY;
              }),
            ),
          ),
        ),
      );

      return {
        loadWeek,

        loadRecipes: rxMethod<void>(
          switchMap(() =>
            recipesApi.list().pipe(
              tap((recipes) => patchState(store, { recipes })),
              catchError(() => EMPTY),
            ),
          ),
        ),

        thisWeek(): void {
          loadWeek(toIsoDate(startOfWeek(clock.today())));
        },

        moveWeek(weeks: number): void {
          loadWeek(toIsoDate(addDays(fromIsoDate(store.weekStart()), 7 * weeks)));
        },

        startAdding(slot: Slot): void {
          patchState(store, { adding: slot });
        },

        cancelAdding(): void {
          patchState(store, { adding: null });
        },

        addMeal: rxMethod<{ recipeId: string; servings: number }>(
          exhaustMap(({ recipeId, servings }) => {
            const slot = store.adding();
            const recipe = store.recipes().find((r) => r.id === recipeId);
            if (!slot || !recipe) return EMPTY;
            return api.add({ ...slot, recipeId, recipeTitle: recipe.title, servings }).pipe(
              tap((meal) => patchState(store, { meals: [...store.meals(), meal], adding: null })),
              catchError(() => {
                toaster.error(`Couldn't plan ${recipe.title}`);
                return EMPTY;
              }),
            );
          }),
        ),

        /** Optimistic, like a stepper should feel. */
        changeServings: rxMethod<{ id: string; servings: number }>(
          mergeMap(({ id, servings }) => {
            const before = store.meals().find((m) => m.id === id)!;
            if (servings < 1) return EMPTY;
            replace({ ...before, servings });
            return api.update(id, { servings }).pipe(
              catchError(() => {
                replace(before);
                return EMPTY;
              }),
            );
          }),
        ),

        removeMeal: rxMethod<string>(
          mergeMap((id) =>
            api.remove(id).pipe(
              tap(() => patchState(store, { meals: store.meals().filter((m) => m.id !== id) })),
              catchError(() => EMPTY),
            ),
          ),
        ),

        /** One list with everything the week's meals need, scaled to their servings. */
        makeGroceryList: rxMethod<string>(
          exhaustMap((name) => {
            const meals = store.meals();
            if (!meals.length) return EMPTY;
            patchState(store, { generating: true });
            const recipeIds = [...new Set(meals.map((m) => m.recipeId))];
            return forkJoin(recipeIds.map((id) => recipesApi.get(id))).pipe(
              map((recipes) => itemsFor(meals, recipes)),
              switchMap((items) => adder.createList(name, items)),
              tap(({ list }) => {
                patchState(store, { generating: false });
                toaster.success(`Made ${list.name} from ${meals.length} meals`);
                void router.navigate(['/groceries', list.id]);
              }),
              catchError(() => {
                patchState(store, { generating: false });
                toaster.error('The grocery list could not be made');
                return EMPTY;
              }),
            );
          }),
        ),
      };
    },
  ),
  withTracing('Meal plan store'),
  withHooks({
    onInit: (store) => {
      store.thisWeek();
      store.loadRecipes();
    },
  }),
);

function itemsFor(meals: PlannedMeal[], recipes: Recipe[]): NewGroceryItem[] {
  const byId = new Map(recipes.map((r) => [r.id, r]));
  return meals.flatMap((meal) => {
    const recipe = byId.get(meal.recipeId)!;
    return recipe.ingredients.map((i) => ({
      name: i.name,
      ...scale(i, meal.servings / recipe.servings),
      aisle: aisleFor(i.name),
      recipes: [recipe.title],
    }));
  });
}
