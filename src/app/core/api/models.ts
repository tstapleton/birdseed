export const UNITS = ['g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'piece', 'pinch', 'clove', 'can', 'bunch'] as const;
export type Unit = (typeof UNITS)[number];

export interface Ingredient {
  name: string;
  quantity: number | null;
  unit: Unit | null;
  note?: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  servings: number;
  prepMinutes: number;
  cookMinutes: number;
  tags: string[];
  ingredients: Ingredient[];
  steps: string[];
  favorite: boolean;
  updatedAt: string;
}

export type RecipeSummary = Pick<Recipe, 'id' | 'title' | 'description' | 'servings' | 'prepMinutes' | 'cookMinutes' | 'tags' | 'favorite'>;

export type RecipeDraft = Omit<Recipe, 'id' | 'favorite' | 'updatedAt'>;

export const AISLES = ['produce', 'bakery', 'dairy', 'meat', 'pantry', 'spices', 'frozen', 'other'] as const;
export type Aisle = (typeof AISLES)[number];

export interface GroceryItem {
  id: string;
  name: string;
  quantity: number | null;
  unit: Unit | null;
  aisle: Aisle;
  checked: boolean;
  /** Recipes this item was added for. */
  recipes: string[];
}

export type NewGroceryItem = Omit<GroceryItem, 'id' | 'checked'>;

export interface GroceryList {
  id: string;
  name: string;
  createdAt: string;
  items: GroceryItem[];
}

export interface GroceryListSummary {
  id: string;
  name: string;
  createdAt: string;
  itemCount: number;
  checkedCount: number;
}

export const MEALS = ['breakfast', 'lunch', 'dinner'] as const;
export type Meal = (typeof MEALS)[number];

export interface PlannedMeal {
  id: string;
  /** ISO date, `YYYY-MM-DD`. */
  date: string;
  meal: Meal;
  recipeId: string;
  recipeTitle: string;
  servings: number;
}

export type NewPlannedMeal = Omit<PlannedMeal, 'id'>;
