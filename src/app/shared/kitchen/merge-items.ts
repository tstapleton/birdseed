import { GroceryItem, NewGroceryItem } from '../../core/api/models';
import { combine } from './units';

export interface MergePlan {
  add: NewGroceryItem[];
  update: { id: string; patch: Pick<GroceryItem, 'quantity' | 'unit' | 'recipes'> }[];
}

/**
 * Works out how to add `incoming` items to a list: an item that matches one still to
 * buy (same ingredient, compatible units) tops it up; anything else is added.
 */
export function planMerge(existing: GroceryItem[], incoming: NewGroceryItem[]): MergePlan {
  const plan: MergePlan = { add: [], update: [] };
  const open = new Map(existing.filter((i) => !i.checked).map((i) => [key(i.name), { ...i }]));

  for (const item of incoming) {
    const target = open.get(key(item.name));
    const total = target ? combine(target, item) : null;
    if (target && total) {
      target.quantity = total.quantity;
      target.unit = total.unit;
      target.recipes = [...new Set([...target.recipes, ...item.recipes])];
      const existingUpdate = plan.update.find((u) => u.id === target.id);
      const patch = { quantity: target.quantity, unit: target.unit, recipes: target.recipes };
      if (existingUpdate) existingUpdate.patch = patch;
      else plan.update.push({ id: target.id, patch });
      continue;
    }

    const pending = plan.add.find((a) => key(a.name) === key(item.name));
    const pendingTotal = pending ? combine(pending, item) : null;
    if (pending && pendingTotal) {
      pending.quantity = pendingTotal.quantity;
      pending.unit = pendingTotal.unit;
      pending.recipes = [...new Set([...pending.recipes, ...item.recipes])];
    } else {
      plan.add.push({ ...item, recipes: [...item.recipes] });
    }
  }
  return plan;
}

/** "Eggs", "egg " and "eggs" are the same item. */
function key(name: string): string {
  return name.trim().toLowerCase().replace(/(es|s)$/, '');
}
