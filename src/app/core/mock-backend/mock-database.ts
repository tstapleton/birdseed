import { GroceryList, GroceryListSummary, NewGroceryItem, NewPlannedMeal, PlannedMeal, Recipe, RecipeDraft, RecipeSummary } from '../api/models';
import { addDays, startOfWeek, toIsoDate } from '../time/dates';
import { SEED_RECIPES, seedGroceryLists, seedMealPlan } from './seed';

interface Tables {
  recipes: Recipe[];
  groceryLists: GroceryList[];
  mealPlan: PlannedMeal[];
}

const STORAGE_KEY = 'kitchen.db.v1';

export class NotFoundError extends Error {}

/** The demo backend's data, kept in localStorage so changes survive a reload. */
export class MockDatabase {
  private tables: Tables;

  constructor(private readonly storage: Storage | undefined, today: Date) {
    this.tables = this.read() ?? seed(today);
    this.write();
  }

  // Recipes

  listRecipes(): RecipeSummary[] {
    return this.tables.recipes.map(toSummary).sort((a, b) => a.title.localeCompare(b.title));
  }

  getRecipe(id: string): Recipe {
    return find(this.tables.recipes, id);
  }

  createRecipe(draft: RecipeDraft): Recipe {
    const recipe: Recipe = { ...draft, id: newId('r'), favorite: false, updatedAt: new Date().toISOString() };
    this.tables.recipes.push(recipe);
    this.write();
    return recipe;
  }

  updateRecipe(id: string, patch: Partial<Recipe>): Recipe {
    const recipe = Object.assign(find(this.tables.recipes, id), patch, { id, updatedAt: new Date().toISOString() });
    this.write();
    return recipe;
  }

  deleteRecipe(id: string): void {
    find(this.tables.recipes, id);
    this.tables.recipes = this.tables.recipes.filter((r) => r.id !== id);
    this.tables.mealPlan = this.tables.mealPlan.filter((m) => m.recipeId !== id);
    this.write();
  }

  // Grocery lists

  listGroceryLists(): GroceryListSummary[] {
    return [...this.tables.groceryLists]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((l) => ({
        id: l.id,
        name: l.name,
        createdAt: l.createdAt,
        itemCount: l.items.length,
        checkedCount: l.items.filter((i) => i.checked).length,
      }));
  }

  getGroceryList(id: string): GroceryList {
    return find(this.tables.groceryLists, id);
  }

  createGroceryList(name: string): GroceryList {
    const list: GroceryList = { id: newId('g'), name, createdAt: new Date().toISOString(), items: [] };
    this.tables.groceryLists.push(list);
    this.write();
    return list;
  }

  deleteGroceryList(id: string): void {
    find(this.tables.groceryLists, id);
    this.tables.groceryLists = this.tables.groceryLists.filter((l) => l.id !== id);
    this.write();
  }

  addGroceryItems(listId: string, items: NewGroceryItem[]): GroceryList {
    const list = find(this.tables.groceryLists, listId);
    list.items.push(...items.map((item) => ({ ...item, id: newId('i'), checked: false })));
    this.write();
    return list;
  }

  updateGroceryItem(listId: string, itemId: string, patch: object): GroceryList {
    const list = find(this.tables.groceryLists, listId);
    Object.assign(find(list.items, itemId), patch, { id: itemId });
    this.write();
    return list;
  }

  removeGroceryItem(listId: string, itemId: string): GroceryList {
    const list = find(this.tables.groceryLists, listId);
    find(list.items, itemId);
    list.items = list.items.filter((i) => i.id !== itemId);
    this.write();
    return list;
  }

  clearChecked(listId: string): GroceryList {
    const list = find(this.tables.groceryLists, listId);
    list.items = list.items.filter((i) => !i.checked);
    this.write();
    return list;
  }

  // Meal plan

  mealsBetween(from: string, to: string): PlannedMeal[] {
    return this.tables.mealPlan.filter((m) => m.date >= from && m.date <= to);
  }

  addMeal(meal: NewPlannedMeal): PlannedMeal {
    const planned: PlannedMeal = { ...meal, id: newId('m') };
    this.tables.mealPlan.push(planned);
    this.write();
    return planned;
  }

  updateMeal(id: string, patch: Partial<NewPlannedMeal>): PlannedMeal {
    const meal = Object.assign(find(this.tables.mealPlan, id), patch, { id });
    this.write();
    return meal;
  }

  removeMeal(id: string): void {
    find(this.tables.mealPlan, id);
    this.tables.mealPlan = this.tables.mealPlan.filter((m) => m.id !== id);
    this.write();
  }

  private read(): Tables | undefined {
    try {
      const raw = this.storage?.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Tables) : undefined;
    } catch {
      return undefined;
    }
  }

  private write(): void {
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(this.tables));
    } catch {
      // Storage full or blocked: keep working in memory.
    }
  }
}

function seed(today: Date): Tables {
  const monday = startOfWeek(today);
  const week = Array.from({ length: 7 }, (_, i) => toIsoDate(addDays(monday, i)));
  return {
    recipes: structuredClone(SEED_RECIPES),
    groceryLists: seedGroceryLists(toIsoDate(today)),
    mealPlan: seedMealPlan(week),
  };
}

function toSummary({ id, title, description, servings, prepMinutes, cookMinutes, tags, favorite }: Recipe): RecipeSummary {
  return { id, title, description, servings, prepMinutes, cookMinutes, tags, favorite };
}

function find<T extends { id: string }>(rows: T[], id: string): T {
  const row = rows.find((r) => r.id === id);
  if (!row) throw new NotFoundError(id);
  return row;
}

function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
