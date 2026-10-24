import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { UNITS } from '../../../core/api/models';
import { RecipeEditorStore } from '../data-access/recipe-editor.store';

/** One row per ingredient, plus pasting a whole list at once. */
@Component({
  selector: 'app-ingredient-rows',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="card card-body stack" aria-labelledby="ingredients-heading">
      <h2 id="ingredients-heading">Ingredients</h2>
      <ol class="rows" aria-label="Ingredient rows">
        @for (row of store.ingredients(); track row.key; let i = $index) {
          <li class="ingredient-row">
            <input class="qty" [attr.aria-label]="'Quantity for ingredient ' + (i + 1)" placeholder="Qty" [value]="row.quantity"
              [attr.aria-invalid]="store.submitted() && !!store.errors().quantities[row.key]" (input)="store.updateIngredient(row.key, { quantity: text($event) })" />
            <select [attr.aria-label]="'Unit for ingredient ' + (i + 1)" (change)="store.updateIngredient(row.key, { unit: $any(text($event)) })">
              <option value="" [selected]="row.unit === ''">—</option>
              @for (unit of units; track unit) {
                <option [value]="unit" [selected]="row.unit === unit">{{ unit }}</option>
              }
            </select>
            <input class="name" [attr.aria-label]="'Ingredient ' + (i + 1)" placeholder="Ingredient" [value]="row.name" (input)="store.updateIngredient(row.key, { name: text($event) })" />
            <input class="note" [attr.aria-label]="'Note for ingredient ' + (i + 1)" placeholder="Note" [value]="row.note" (input)="store.updateIngredient(row.key, { note: text($event) })" />
            <button type="button" class="icon" [attr.aria-label]="'Remove ingredient ' + (i + 1)" (click)="store.removeIngredient(row.key)">×</button>
          </li>
        }
      </ol>
      <div class="row">
        <button type="button" (click)="store.addIngredient()">Add ingredient</button>
        <button type="button" class="ghost" [attr.aria-expanded]="pasting()" (click)="pasting.set(!pasting())">Paste a list</button>
      </div>
      @if (pasting()) {
        <div class="field">
          <label for="paste">One ingredient per line, e.g. “2 cups flour”</label>
          <textarea id="paste" rows="5" #paste></textarea>
          <div class="row">
            <button type="button" (click)="addPasted(paste)">Add these ingredients</button>
          </div>
        </div>
      }
    </section>
  `,
  styles: `
    .rows { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
    .ingredient-row { display: grid; grid-template-columns: 72px 92px minmax(0, 2fr) minmax(0, 1.2fr) auto; gap: 8px; align-items: center; }
    @media (max-width: 640px) { .ingredient-row { grid-template-columns: 64px 84px minmax(0, 1fr) auto; } .ingredient-row .note { display: none; } }
  `,
})
export class IngredientRowsComponent {
  protected readonly store = inject(RecipeEditorStore);
  protected readonly units = UNITS;
  protected readonly pasting = signal(false);

  protected text(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected addPasted(textarea: HTMLTextAreaElement): void {
    this.store.addIngredientsFromText(textarea.value);
    textarea.value = '';
    this.pasting.set(false);
  }
}
