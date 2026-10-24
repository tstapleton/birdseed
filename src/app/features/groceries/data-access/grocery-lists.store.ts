import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { withTracing } from '@tstapleton/plotline/store';
import { EMPTY, catchError, exhaustMap, pipe, switchMap, tap } from 'rxjs';
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
    load: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { status: 'loading' })),
        switchMap(() =>
          api.lists().pipe(
            tap((lists) => patchState(store, { lists, status: 'loaded' })),
            catchError(() => {
              patchState(store, { status: 'error' });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),

    create: rxMethod<string>(
      exhaustMap((name) => {
        patchState(store, { creating: true });
        return api.create(name.trim()).pipe(
          tap((list) => {
            patchState(store, { creating: false });
            void router.navigate(['/groceries', list.id]);
          }),
          catchError(() => {
            patchState(store, { creating: false });
            toaster.error('The list could not be created');
            return EMPTY;
          }),
        );
      }),
    ),
  })),
  withTracing('Grocery lists store'),
  withHooks({ onInit: (store) => store.load() }),
);
