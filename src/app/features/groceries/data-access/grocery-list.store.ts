import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { withTracing } from '@tsociety/plotline/store';
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

    /** Adds run one at a time, so each sees the list the previous one left. */
    let adding = Promise.resolve();

    return {
      async load(id: string): Promise<void> {
        patchState(store, { status: 'loading' });
        try {
          patchState(store, { list: await api.get(id), status: 'loaded' });
        } catch {
          patchState(store, { status: 'missing' });
        }
      },

      /** Free text such as "2 kg potatoes"; several items can be separated by commas. */
      addFromText(text: string): Promise<void> {
        const items = text
          .split(/[,\n]/)
          .map(parseIngredientLine)
          .filter((p) => p !== null)
          .map((p) => ({ ...p, aisle: aisleFor(p.name), recipes: [] }));
        if (!items.length) return adding;
        adding = adding.then(async () => {
          try {
            setList((await adder.addToList(listId(), items)).list);
          } catch {
            toaster.error('That could not be added');
          }
        });
        return adding;
      },

      /** Optimistic: the tick shows at once. */
      async toggle(itemId: string): Promise<void> {
        const item = store.list()!.items.find((i) => i.id === itemId)!;
        const checked = !item.checked;
        const setChecked = (value: boolean) =>
          setList({ ...store.list()!, items: store.list()!.items.map((i) => (i.id === itemId ? { ...i, checked: value } : i)) });
        setChecked(checked);
        try {
          await api.updateItem(listId(), itemId, { checked });
        } catch {
          setChecked(!checked);
          toaster.error(`Couldn't update ${item.name}`);
        }
      },

      async remove(itemId: string): Promise<void> {
        try {
          setList(await api.removeItem(listId(), itemId));
        } catch {
          toaster.error('That could not be removed');
        }
      },

      async clearChecked(): Promise<void> {
        try {
          setList(await api.clearChecked(listId()));
          toaster.success('Cleared the basket');
        } catch {
          toaster.error('The basket could not be cleared');
        }
      },

      toggleGrouping(): void {
        patchState(store, { groupByAisle: !store.groupByAisle() });
      },

      askToDelete(): void {
        patchState(store, { deletion: 'confirming' });
      },

      cancelDelete(): void {
        patchState(store, { deletion: 'idle' });
      },

      async delete(): Promise<void> {
        const list = store.list()!;
        if (store.deletion() === 'deleting') return;
        patchState(store, { deletion: 'deleting' });
        try {
          await api.delete(list.id);
          toaster.success(`Deleted ${list.name}`);
          await router.navigateByUrl('/groceries');
        } catch {
          patchState(store, { deletion: 'idle' });
        }
      },
    };
  }),
  withTracing('Grocery list store'),
);
