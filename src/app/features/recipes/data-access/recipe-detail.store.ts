import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { withTracing } from '@tstapleton/plotline/store';
import { GroceryApi } from '../../../core/api/grocery-api';
import { MealPlanApi } from '../../../core/api/meal-plan-api';
import { GroceryListSummary, Ingredient, Meal, Recipe } from '../../../core/api/models';
import { fromIsoDate } from '../../../core/time/dates';
import { RecipesApi } from '../../../core/api/recipes-api';
import { ApiError } from '../../../core/api/transport';
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
    ) => {
      /** Counts loads, so a slow response for a recipe the user left is ignored. */
      let loads = 0;

      return {
        async load(id: string): Promise<void> {
          const load = ++loads;
          patchState(store, { status: 'loading', recipe: null, deletion: 'idle' });
          try {
            const recipe = await api.get(id);
            if (load === loads) patchState(store, { recipe, servings: recipe.servings, status: 'loaded' });
          } catch (error) {
            if (load === loads) patchState(store, { status: error instanceof ApiError && error.status === 404 ? 'missing' : 'error' });
          }
        },

        setServings(servings: number): void {
          patchState(store, { servings: Math.min(99, Math.max(1, Math.round(servings))) });
        },

        askToDelete(): void {
          patchState(store, { deletion: 'confirming' });
        },

        cancelDelete(): void {
          patchState(store, { deletion: 'idle' });
        },

        async delete(): Promise<void> {
          const recipe = store.recipe();
          if (!recipe || store.deletion() === 'deleting') return;
          patchState(store, { deletion: 'deleting' });
          try {
            await api.delete(recipe.id);
            toaster.success(`Deleted ${recipe.title}`);
            await router.navigateByUrl('/recipes');
          } catch {
            patchState(store, { deletion: 'idle' });
            toaster.error(`Couldn't delete ${recipe.title}`);
          }
        },

        async openShopping(): Promise<void> {
          patchState(store, { shopping: { open: true, status: 'loading', lists: [] } });
          const lists = await groceryApi.lists().catch(() => []);
          patchState(store, { shopping: { open: true, status: 'ready', lists } });
        },

        closeShopping(): void {
          patchState(store, { shopping: { ...store.shopping(), open: false } });
        },

        /** Adds the ingredients, scaled to the servings shown, to a list. */
        async addToGroceryList(target: ShoppingTarget): Promise<void> {
          const recipe = store.recipe()!;
          if (store.shopping().status === 'adding') return;
          const items = store.scaled().map((i) => ({
            name: i.name,
            quantity: i.quantity,
            unit: i.unit,
            aisle: aisleFor(i.name),
            recipes: [recipe.title],
          }));
          patchState(store, { shopping: { ...store.shopping(), status: 'adding' } });
          try {
            const { list } = 'listId' in target ? await adder.addToList(target.listId, items) : await adder.createList(target.newListName.trim(), items);
            patchState(store, { shopping: { ...store.shopping(), open: false, status: 'ready' } });
            toaster.success(`Added ${recipe.title} to ${list.name}`);
          } catch {
            patchState(store, { shopping: { ...store.shopping(), status: 'ready' } });
            toaster.error(`Couldn't add ${recipe.title} to the list`);
          }
        },

        togglePlanning(): void {
          patchState(store, { planning: { open: !store.planning().open, saving: false } });
        },

        /** Plans this recipe, at the servings shown, for a day and meal. */
        async addToPlan({ date, meal }: { date: string; meal: Meal }): Promise<void> {
          const recipe = store.recipe()!;
          if (store.planning().saving) return;
          patchState(store, { planning: { open: true, saving: true } });
          try {
            await mealPlanApi.add({ date, meal, recipeId: recipe.id, recipeTitle: recipe.title, servings: store.servings() });
            patchState(store, { planning: { open: false, saving: false } });
            const day = fromIsoDate(date).toLocaleDateString('en-GB', { weekday: 'long' });
            toaster.success(`Planned ${recipe.title} for ${day} ${meal}`);
          } catch {
            patchState(store, { planning: { open: true, saving: false } });
            toaster.error(`Couldn't plan ${recipe.title}`);
          }
        },
      };
    },
  ),
  withTracing('Recipe store'),
);
