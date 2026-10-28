import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { withTracing } from '@tsociety/plotline/store';
import { Recipe, RecipeDraft, Unit } from '../../../core/api/models';
import { RecipesApi } from '../../../core/api/recipes-api';
import { Toaster } from '../../../core/notifications/toaster';
import { parseIngredientLine, parseQuantityText } from '../../../shared/kitchen/ingredient-parser';
import { formatQuantity } from '../../../shared/kitchen/units';

export interface IngredientRow {
  key: number;
  quantity: string;
  unit: Unit | '';
  name: string;
  note: string;
}

export interface StepRow {
  key: number;
  text: string;
}

export interface RecipeForm {
  title: string;
  description: string;
  servings: number | null;
  prepMinutes: number | null;
  cookMinutes: number | null;
  tags: string;
}

interface EditorState {
  mode: 'create' | 'edit';
  recipeId: string | null;
  status: 'loading' | 'ready' | 'saving' | 'missing';
  form: RecipeForm;
  ingredients: IngredientRow[];
  steps: StepRow[];
  /** Errors only show once the user has tried to save. */
  submitted: boolean;
  nextKey: number;
}

const blankForm: RecipeForm = { title: '', description: '', servings: 4, prepMinutes: null, cookMinutes: null, tags: '' };

const initialState: EditorState = {
  mode: 'create',
  recipeId: null,
  status: 'ready',
  form: blankForm,
  ingredients: [{ key: 1, quantity: '', unit: '', name: '', note: '' }],
  steps: [{ key: 2, text: '' }],
  submitted: false,
  nextKey: 3,
};

export interface EditorErrors {
  title?: string;
  servings?: string;
  ingredients?: string;
  steps?: string;
  /** Rows whose quantity isn't a number, by row key. */
  quantities: Record<number, string>;
}

/** The create/edit form for a recipe. */
export const RecipeEditorStore = signalStore(
  withState(initialState),
  withComputed((store) => {
    const namedIngredients = computed(() => store.ingredients().filter((i) => i.name.trim()));
    const errors = computed<EditorErrors>(() => {
      const form = store.form();
      const quantities: Record<number, string> = {};
      for (const row of store.ingredients()) {
        if (Number.isNaN(parseQuantityText(row.quantity))) quantities[row.key] = 'Use a number like 2, 1.5 or 1½';
      }
      return {
        title: form.title.trim() ? undefined : 'Give the recipe a name',
        servings: form.servings && form.servings >= 1 ? undefined : 'Servings must be at least 1',
        ingredients: namedIngredients().length ? undefined : 'Add at least one ingredient',
        steps: store.steps().some((s) => s.text.trim()) ? undefined : 'Add at least one step',
        quantities,
      };
    });
    return {
      errors,
      valid: computed(() => {
        const e = errors();
        return !e.title && !e.servings && !e.ingredients && !e.steps && !Object.keys(e.quantities).length;
      }),
      draft: computed<RecipeDraft>(() => {
        const form = store.form();
        return {
          title: form.title.trim(),
          description: form.description.trim(),
          servings: form.servings ?? 1,
          prepMinutes: form.prepMinutes ?? 0,
          cookMinutes: form.cookMinutes ?? 0,
          tags: [...new Set(form.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean))],
          ingredients: namedIngredients().map((row) => ({
            name: row.name.trim(),
            quantity: parseQuantityText(row.quantity),
            unit: row.unit || (row.quantity.trim() ? 'piece' : null),
            ...(row.note.trim() ? { note: row.note.trim() } : {}),
          })),
          steps: store.steps().map((s) => s.text.trim()).filter(Boolean),
        };
      }),
    };
  }),
  withMethods((store, api = inject(RecipesApi), toaster = inject(Toaster), router = inject(Router)) => {
    /** Hands out `count` fresh row keys; the caller saves `nextKey` in the same patch. */
    const keys = (count: number) => {
      const first = store.nextKey();
      return { keys: Array.from({ length: count }, (_, i) => first + i), nextKey: first + count };
    };
    const blankIngredient = (key: number): IngredientRow => ({ key, quantity: '', unit: '', name: '', note: '' });

    return {
      async edit(id: string): Promise<void> {
        patchState(store, { mode: 'edit', recipeId: id, status: 'loading' });
        try {
          const recipe = await api.get(id);
          patchState(store, { ...toForm(recipe, store.nextKey()), status: 'ready' });
        } catch {
          patchState(store, { status: 'missing' });
        }
      },

      setField<K extends keyof RecipeForm>(field: K, value: RecipeForm[K]): void {
        patchState(store, { form: { ...store.form(), [field]: value } });
      },

      addIngredient(): void {
        const { keys: [key], nextKey } = keys(1);
        patchState(store, { ingredients: [...store.ingredients(), blankIngredient(key!)], nextKey });
      },

      updateIngredient(rowKey: number, patch: Partial<Omit<IngredientRow, 'key'>>): void {
        patchState(store, { ingredients: store.ingredients().map((row) => (row.key === rowKey ? { ...row, ...patch } : row)) });
      },

      removeIngredient(rowKey: number): void {
        const rows = store.ingredients().filter((row) => row.key !== rowKey);
        if (rows.length) return patchState(store, { ingredients: rows });
        const { keys: [key], nextKey } = keys(1);
        patchState(store, { ingredients: [blankIngredient(key!)], nextKey });
      },

      /** One ingredient per line, e.g. "2 cups flour". Fills the empty rows first. */
      addIngredientsFromText(text: string): number {
        const parsed = text.split('\n').map(parseIngredientLine).filter((p) => p !== null);
        const { keys: rowKeys, nextKey } = keys(parsed.length);
        const rows = parsed.map((p, i) => ({
          key: rowKeys[i]!,
          quantity: p.quantity === null ? '' : formatQuantity(p.quantity),
          unit: p.unit ?? ('' as const),
          name: p.name,
          note: '',
        }));
        patchState(store, { ingredients: [...store.ingredients().filter((row) => row.name.trim() || row.quantity.trim()), ...rows], nextKey });
        return rows.length;
      },

      addStep(): void {
        const { keys: [key], nextKey } = keys(1);
        patchState(store, { steps: [...store.steps(), { key: key!, text: '' }], nextKey });
      },

      updateStep(rowKey: number, text: string): void {
        patchState(store, { steps: store.steps().map((s) => (s.key === rowKey ? { ...s, text } : s)) });
      },

      removeStep(rowKey: number): void {
        const steps = store.steps().filter((s) => s.key !== rowKey);
        if (steps.length) return patchState(store, { steps });
        const { keys: [key], nextKey } = keys(1);
        patchState(store, { steps: [{ key: key!, text: '' }], nextKey });
      },

      async save(): Promise<void> {
        if (store.status() === 'saving') return;
        patchState(store, { submitted: true });
        if (!store.valid()) return;
        patchState(store, { status: 'saving' });
        const id = store.recipeId();
        try {
          const recipe = store.mode() === 'edit' && id ? await api.update(id, store.draft()) : await api.create(store.draft());
          toaster.success(`Saved ${recipe.title}`);
          await router.navigate(['/recipes', recipe.id]);
        } catch {
          patchState(store, { status: 'ready' });
          toaster.error('The recipe could not be saved');
        }
      },
    };
  }),
  withTracing('Recipe editor store'),
);

function toForm(recipe: Recipe, firstKey: number): Pick<EditorState, 'form' | 'ingredients' | 'steps' | 'nextKey'> {
  let next = firstKey;
  return {
    form: {
      title: recipe.title,
      description: recipe.description,
      servings: recipe.servings,
      prepMinutes: recipe.prepMinutes,
      cookMinutes: recipe.cookMinutes,
      tags: recipe.tags.join(', '),
    },
    ingredients: recipe.ingredients.map((i) => ({
      key: next++,
      quantity: i.quantity === null ? '' : formatQuantity(i.quantity),
      unit: i.unit ?? '',
      name: i.name,
      note: i.note ?? '',
    })),
    steps: recipe.steps.map((text) => ({ key: next++, text })),
    nextKey: next,
  };
}
