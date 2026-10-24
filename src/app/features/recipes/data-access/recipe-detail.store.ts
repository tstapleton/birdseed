import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { withTracing } from '@tstapleton/plotline/store';
import { EMPTY, catchError, exhaustMap, pipe, switchMap, tap } from 'rxjs';
import { Recipe } from '../../../core/api/models';
import { RecipesApi } from '../../../core/api/recipes-api';
import { Toaster } from '../../../core/notifications/toaster';
import { formatAmount, scale } from '../../../shared/kitchen/units';

interface RecipeDetailState {
  recipe: Recipe | null;
  status: 'loading' | 'loaded' | 'missing' | 'error';
  servings: number;
  deletion: 'idle' | 'confirming' | 'deleting';
}

const initialState: RecipeDetailState = { recipe: null, status: 'loading', servings: 1, deletion: 'idle' };

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
    return {
      factor,
      ingredients: computed<ScaledIngredient[]>(() =>
        (store.recipe()?.ingredients ?? []).map((i) => ({ name: i.name, amount: formatAmount(scale(i, factor())), note: i.note })),
      ),
      totalMinutes: computed(() => (store.recipe()?.prepMinutes ?? 0) + (store.recipe()?.cookMinutes ?? 0)),
    };
  }),
  withMethods((store, api = inject(RecipesApi), toaster = inject(Toaster), router = inject(Router)) => ({
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
  })),
  withTracing('Recipe store'),
);
