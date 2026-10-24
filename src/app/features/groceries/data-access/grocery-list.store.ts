import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { withTracing } from '@tstapleton/plotline/store';
import { EMPTY, catchError, concatMap, exhaustMap, mergeMap, pipe, switchMap, tap } from 'rxjs';
import { GroceryApi } from '../../../core/api/grocery-api';
import { AISLES, Aisle, GroceryItem, GroceryList } from '../../../core/api/models';
import { Toaster } from '../../../core/notifications/toaster';
import { aisleFor } from '../../../shared/kitchen/aisles';
import { parseIngredientLine } from '../../../shared/kitchen/ingredient-parser';
import { GroceryAdder } from './grocery-adder';

export const AISLE_LABELS: Record<Aisle, string> = {
  produce: 'Fruit and veg',
  bakery: 'Bakery',
  dairy: 'Dairy and eggs',
  meat: 'Meat and fish',
  pantry: 'Cupboard',
  spices: 'Herbs and spices',
  frozen: 'Frozen',
  other: 'Everything else',
};

export interface ItemSection {
  id: string;
  title: string;
  items: GroceryItem[];
}

interface GroceryListState {
  list: GroceryList | null;
  status: 'loading' | 'loaded' | 'missing';
  groupByAisle: boolean;
  deletion: 'idle' | 'confirming' | 'deleting';
}

/** One grocery list: adding, checking off and clearing items. */
export const GroceryListStore = signalStore(
  withState<GroceryListState>({ list: null, status: 'loading', groupByAisle: true, deletion: 'idle' }),
  withComputed((store) => {
    const items = computed(() => store.list()?.items ?? []);
    const byName = (a: GroceryItem, b: GroceryItem) => a.name.localeCompare(b.name);
    return {
      progress: computed(() => ({ checked: items().filter((i) => i.checked).length, total: items().length })),
      sections: computed<ItemSection[]>(() => {
        const toBuy = items().filter((i) => !i.checked);
        const basket = items().filter((i) => i.checked).sort(byName);
        const sections: ItemSection[] = store.groupByAisle()
          ? AISLES.map((aisle) => ({ id: aisle, title: AISLE_LABELS[aisle], items: toBuy.filter((i) => i.aisle === aisle).sort(byName) }))
          : [{ id: 'to-buy', title: 'To buy', items: [...toBuy].sort(byName) }];
        if (basket.length) sections.push({ id: 'basket', title: 'In the basket', items: basket });
        return sections.filter((s) => s.items.length);
      }),
    };
  }),
  withMethods((store, api = inject(GroceryApi), adder = inject(GroceryAdder), toaster = inject(Toaster), router = inject(Router)) => {
    const setList = (list: GroceryList) => patchState(store, { list });
    const listId = () => store.list()!.id;

    return {
      load: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { status: 'loading' })),
          switchMap((id) =>
            api.get(id).pipe(
              tap((list) => patchState(store, { list, status: 'loaded' })),
              catchError(() => {
                patchState(store, { status: 'missing' });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      /** Free text such as "2 kg potatoes"; several items can be separated by commas. */
      addFromText: rxMethod<string>(
        concatMap((text) => {
          const items = text
            .split(/[,\n]/)
            .map(parseIngredientLine)
            .filter((p) => p !== null)
            .map((p) => ({ ...p, aisle: aisleFor(p.name), recipes: [] }));
          if (!items.length) return EMPTY;
          return adder.addToList(listId(), items).pipe(
            tap(({ list }) => setList(list)),
            catchError(() => {
              toaster.error('That could not be added');
              return EMPTY;
            }),
          );
        }),
      ),

      /** Optimistic: the tick shows at once. */
      toggle: rxMethod<string>(
        mergeMap((itemId) => {
          const item = store.list()!.items.find((i) => i.id === itemId)!;
          const checked = !item.checked;
          setList({ ...store.list()!, items: store.list()!.items.map((i) => (i.id === itemId ? { ...i, checked } : i)) });
          return api.updateItem(listId(), itemId, { checked }).pipe(
            catchError(() => {
              setList({ ...store.list()!, items: store.list()!.items.map((i) => (i.id === itemId ? { ...i, checked: !checked } : i)) });
              toaster.error(`Couldn't update ${item.name}`);
              return EMPTY;
            }),
          );
        }),
      ),

      remove: rxMethod<string>(
        mergeMap((itemId) =>
          api.removeItem(listId(), itemId).pipe(
            tap(setList),
            catchError(() => EMPTY),
          ),
        ),
      ),

      clearChecked: rxMethod<void>(
        exhaustMap(() =>
          api.clearChecked(listId()).pipe(
            tap((list) => {
              setList(list);
              toaster.success('Cleared the basket');
            }),
            catchError(() => EMPTY),
          ),
        ),
      ),

      toggleGrouping(): void {
        patchState(store, { groupByAisle: !store.groupByAisle() });
      },

      askToDelete(): void {
        patchState(store, { deletion: 'confirming' });
      },

      cancelDelete(): void {
        patchState(store, { deletion: 'idle' });
      },

      delete: rxMethod<void>(
        exhaustMap(() => {
          const list = store.list()!;
          patchState(store, { deletion: 'deleting' });
          return api.delete(list.id).pipe(
            tap(() => {
              toaster.success(`Deleted ${list.name}`);
              void router.navigateByUrl('/groceries');
            }),
            catchError(() => {
              patchState(store, { deletion: 'idle' });
              return EMPTY;
            }),
          );
        }),
      ),
    };
  }),
  withTracing('Grocery list store'),
);
