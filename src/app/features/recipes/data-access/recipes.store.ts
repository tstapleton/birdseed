import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { withTracing } from '@tsociety/plotline/store';
import { RecipeSummary } from '../../../core/api/models';
import { RecipesApi } from '../../../core/api/recipes-api';
import { Toaster } from '../../../core/notifications/toaster';

interface RecipesState {
  recipes: RecipeSummary[];
  status: 'idle' | 'loading' | 'loaded' | 'error';
  search: string;
  selectedTags: string[];
  favoritesOnly: boolean;
}

const initialState: RecipesState = { recipes: [], status: 'idle', search: '', selectedTags: [], favoritesOnly: false };

/** The recipe collection, with search and filters. */
export const RecipesStore = signalStore(
  withState(initialState),
  withComputed((store) => ({
    tags: computed(() => [...new Set(store.recipes().flatMap((r) => r.tags))].sort()),
    visible: computed(() => {
      const search = store.search().trim().toLowerCase();
      const tags = store.selectedTags();
      return store.recipes().filter(
        (r) =>
          (!store.favoritesOnly() || r.favorite) &&
          tags.every((t) => r.tags.includes(t)) &&
          (!search || [r.title, r.description, ...r.tags].some((text) => text.toLowerCase().includes(search))),
      );
    }),
    filtered: computed(() => !!store.search().trim() || store.selectedTags().length > 0 || store.favoritesOnly()),
  })),
  withMethods((store, api = inject(RecipesApi), toaster = inject(Toaster)) => {
    const setFavorite = (id: string, favorite: boolean) =>
      patchState(store, { recipes: store.recipes().map((r) => (r.id === id ? { ...r, favorite } : r)) });

    return {
      async load(): Promise<void> {
        if (store.status() === 'loading') return;
        patchState(store, { status: 'loading' });
        try {
          patchState(store, { recipes: await api.list(), status: 'loaded' });
        } catch {
          patchState(store, { status: 'error' });
          toaster.error('Recipes could not be loaded');
        }
      },

      setSearch(search: string): void {
        patchState(store, { search });
      },

      toggleTag(tag: string): void {
        const selected = store.selectedTags();
        patchState(store, { selectedTags: selected.includes(tag) ? selected.filter((t) => t !== tag) : [...selected, tag] });
      },

      toggleFavoritesOnly(): void {
        patchState(store, { favoritesOnly: !store.favoritesOnly() });
      },

      clearFilters(): void {
        patchState(store, { search: '', selectedTags: [], favoritesOnly: false });
      },

      /** Optimistic: the star changes at once and reverts if saving fails. */
      async toggleFavorite(id: string): Promise<void> {
        const recipe = store.recipes().find((r) => r.id === id);
        if (!recipe) return;
        const favorite = !recipe.favorite;
        setFavorite(id, favorite);
        try {
          await api.setFavorite(id, favorite);
        } catch {
          setFavorite(id, !favorite);
          toaster.error(`Couldn't update ${recipe.title}`);
        }
      },
    };
  }),
  withTracing('Recipes store'),
  withHooks({ onInit: (store) => void store.load() }),
);
