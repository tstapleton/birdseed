import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import { withTracing } from '@tsociety/plotline/store';
import { GroceryApi } from '../../../core/api/grocery-api';
import { GroceryListSummary } from '../../../core/api/models';
import { Toaster } from '../../../core/notifications/toaster';

interface GroceryListsState {
  lists: GroceryListSummary[];
  status: 'loading' | 'loaded' | 'error';
  creating: boolean;
}

/** Every grocery list, newest first. */
export const GroceryListsStore = signalStore(
  withState<GroceryListsState>({ lists: [], status: 'loading', creating: false }),
  withMethods((store, api = inject(GroceryApi), toaster = inject(Toaster), router = inject(Router)) => ({
    async load(): Promise<void> {
      patchState(store, { status: 'loading' });
      try {
        patchState(store, { lists: await api.lists(), status: 'loaded' });
      } catch {
        patchState(store, { status: 'error' });
      }
    },

    async create(name: string): Promise<void> {
      if (store.creating()) return;
      patchState(store, { creating: true });
      try {
        const list = await api.create(name.trim());
        patchState(store, { creating: false });
        await router.navigate(['/groceries', list.id]);
      } catch {
        patchState(store, { creating: false });
        toaster.error('The list could not be created');
      }
    },
  })),
  withTracing('Grocery lists store'),
  withHooks({ onInit: (store) => void store.load() }),
);
