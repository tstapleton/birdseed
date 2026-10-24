import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { withTracing } from '@tstapleton/plotline/store';
import { GroceryApi } from '../../../core/api/grocery-api';
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
      groceryApi = inject(GroceryApi),
      adder = inject(GroceryAdder),
      toaster = inject(Toaster),
      clock = inject(Clock),
      router = inject(Router),
    ) => {
      const replace = (meal: PlannedMeal) => patchState(store, { meals: store.meals().map((m) => (m.id === meal.id ? meal : m)) });
      /** Counts loads, so a slow response for a week the user moved past is ignored. */
      let loads = 0;

      const loadWeek = async (weekStart: string): Promise<void> => {
        const load = ++loads;
        patchState(store, { weekStart, status: 'loading', adding: null });
        try {
          const meals = await api.range(weekStart, toIsoDate(addDays(fromIsoDate(weekStart), 6)));
          if (load === loads) patchState(store, { meals, status: 'loaded' });
        } catch {
          if (load === loads) patchState(store, { status: 'error' });
        }
      };

      return {
        loadWeek,

        async loadRecipes(): Promise<void> {
          try {
            patchState(store, { recipes: await recipesApi.list() });
          } catch {
            // The picker stays empty; planning still works from a recipe's page.
          }
        },

        thisWeek(): Promise<void> {
          return loadWeek(toIsoDate(startOfWeek(clock.today())));
        },

        moveWeek(weeks: number): Promise<void> {
          return loadWeek(toIsoDate(addDays(fromIsoDate(store.weekStart()), 7 * weeks)));
        },

        startAdding(slot: Slot): void {
          patchState(store, { adding: slot });
        },

        cancelAdding(): void {
          patchState(store, { adding: null });
        },

        async addMeal({ recipeId, servings }: { recipeId: string; servings: number }): Promise<void> {
          const slot = store.adding();
          const recipe = store.recipes().find((r) => r.id === recipeId);
          if (!slot || !recipe) return;
          try {
            const meal = await api.add({ ...slot, recipeId, recipeTitle: recipe.title, servings });
            patchState(store, { meals: [...store.meals(), meal], adding: null });
          } catch {
            toaster.error(`Couldn't plan ${recipe.title}`);
          }
        },

        /** Optimistic, like a stepper should feel. */
        async changeServings({ id, servings }: { id: string; servings: number }): Promise<void> {
          const before = store.meals().find((m) => m.id === id)!;
          if (servings < 1) return;
          replace({ ...before, servings });
          try {
            await api.update(id, { servings });
          } catch {
            replace(before);
          }
        },

        async removeMeal(id: string): Promise<void> {
          try {
            await api.remove(id);
            patchState(store, { meals: store.meals().filter((m) => m.id !== id) });
          } catch {
            toaster.error("That meal couldn't be removed");
          }
        },

        /**
         * One list with everything the week's meals need, scaled to their servings. If the
         * week already has a list, it's topped up rather than duplicated.
         */
        async makeGroceryList(name: string): Promise<void> {
          const meals = store.meals();
          if (!meals.length || store.generating()) return;
          patchState(store, { generating: true });
          try {
            const recipeIds = [...new Set(meals.map((m) => m.recipeId))];
            const [recipes, lists] = await Promise.all([Promise.all(recipeIds.map((id) => recipesApi.get(id))), groceryApi.lists()]);
            const existing = lists.find((l) => l.name === name);
            const items = itemsFor(meals, recipes);
            const { list } = existing ? await adder.addToList(existing.id, items) : await adder.createList(name, items);
            patchState(store, { generating: false });
            toaster.success(`Added ${meals.length} meals to ${list.name}`);
            await router.navigate(['/groceries', list.id]);
          } catch {
            patchState(store, { generating: false });
            toaster.error('The grocery list could not be made');
          }
        },
      };
    },
  ),
  withTracing('Meal plan store'),
  withHooks({
    onInit: (store) => {
      void store.thisWeek();
      void store.loadRecipes();
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
