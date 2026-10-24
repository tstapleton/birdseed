import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UNITS } from '../../../core/api/models';
import { RecipeEditorStore, RecipeForm } from '../data-access/recipe-editor.store';

@Component({
  selector: 'app-recipe-editor-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  providers: [RecipeEditorStore],
  template: `
    <a class="back" [routerLink]="id() ? ['/recipes', id()] : ['/recipes']">← {{ id() ? 'Back to recipe' : 'All recipes' }}</a>

    @if (store.status() === 'loading') {
      <p class="empty" role="status">Loading recipe…</p>
    } @else if (store.status() === 'missing') {
      <p class="empty" role="alert">That recipe doesn't exist.</p>
    } @else {
      <form class="editor" novalidate (submit)="$event.preventDefault(); store.save()" [attr.aria-label]="heading()">
        <h1>{{ heading() }}</h1>

        @if (store.submitted() && !store.valid()) {
          <div class="error-summary card" role="alert">
            <strong>Check the recipe before saving:</strong>
            <ul>
              @for (message of errorMessages(); track message) {
                <li>{{ message }}</li>
              }
            </ul>
          </div>
        }

        <section class="card card-body stack" aria-label="Details">
          <div class="field">
            <label for="title">Name</label>
            <input id="title" [value]="store.form().title" (input)="set('title', value($event))" [attr.aria-invalid]="show(store.errors().title)" />
          </div>
          <div class="field">
            <label for="description">Description</label>
            <textarea id="description" rows="2" [value]="store.form().description" (input)="set('description', value($event))"></textarea>
          </div>
          <div class="numbers">
            <div class="field">
              <label for="servings">Servings</label>
              <input id="servings" type="number" min="1" [value]="store.form().servings ?? ''" (input)="set('servings', number($event))" [attr.aria-invalid]="show(store.errors().servings)" />
            </div>
            <div class="field">
              <label for="prep">Prep (minutes)</label>
              <input id="prep" type="number" min="0" [value]="store.form().prepMinutes ?? ''" (input)="set('prepMinutes', number($event))" />
            </div>
            <div class="field">
              <label for="cook">Cook (minutes)</label>
              <input id="cook" type="number" min="0" [value]="store.form().cookMinutes ?? ''" (input)="set('cookMinutes', number($event))" />
            </div>
          </div>
          <div class="field">
            <label for="tags">Tags</label>
            <input id="tags" placeholder="dinner, vegetarian, quick" [value]="store.form().tags" (input)="set('tags', value($event))" />
          </div>
        </section>

        <section class="card card-body stack" aria-labelledby="ingredients-heading">
          <h2 id="ingredients-heading">Ingredients</h2>
          <ol class="rows" aria-label="Ingredient rows">
            @for (row of store.ingredients(); track row.key; let i = $index) {
              <li class="ingredient-row">
                <input class="qty" [attr.aria-label]="'Quantity for ingredient ' + (i + 1)" placeholder="Qty" [value]="row.quantity"
                  [attr.aria-invalid]="show(store.errors().quantities[row.key])" (input)="store.updateIngredient(row.key, { quantity: value($event) })" />
                <select [attr.aria-label]="'Unit for ingredient ' + (i + 1)" (change)="store.updateIngredient(row.key, { unit: $any(value($event)) })">
                  <option value="" [selected]="row.unit === ''">—</option>
                  @for (unit of units; track unit) {
                    <option [value]="unit" [selected]="row.unit === unit">{{ unit }}</option>
                  }
                </select>
                <input class="name" [attr.aria-label]="'Ingredient ' + (i + 1)" placeholder="Ingredient" [value]="row.name" (input)="store.updateIngredient(row.key, { name: value($event) })" />
                <input class="note" [attr.aria-label]="'Note for ingredient ' + (i + 1)" placeholder="Note" [value]="row.note" (input)="store.updateIngredient(row.key, { note: value($event) })" />
                <button type="button" class="icon" [attr.aria-label]="'Remove ingredient ' + (i + 1)" (click)="store.removeIngredient(row.key)">×</button>
              </li>
            }
          </ol>
          <div class="row">
            <button type="button" (click)="store.addIngredient()">Add ingredient</button>
            <button type="button" class="ghost" [attr.aria-expanded]="pasting()" (click)="pasting.set(!pasting())">Paste a list</button>
          </div>
          @if (pasting()) {
            <div class="field paste">
              <label for="paste">One ingredient per line, e.g. “2 cups flour”</label>
              <textarea id="paste" rows="5" #paste></textarea>
              <div class="row">
                <button type="button" (click)="addPasted(paste)">Add these ingredients</button>
              </div>
            </div>
          }
        </section>

        <section class="card card-body stack" aria-labelledby="steps-heading">
          <h2 id="steps-heading">Method</h2>
          <ol class="rows steps">
            @for (step of store.steps(); track step.key; let i = $index) {
              <li class="step-row">
                <textarea rows="2" [attr.aria-label]="'Step ' + (i + 1)" [value]="step.text" (input)="store.updateStep(step.key, value($event))"></textarea>
                <button type="button" class="icon" [attr.aria-label]="'Remove step ' + (i + 1)" (click)="store.removeStep(step.key)">×</button>
              </li>
            }
          </ol>
          <div class="row"><button type="button" (click)="store.addStep()">Add step</button></div>
        </section>

        <div class="row actions">
          <button type="submit" class="primary" [disabled]="store.status() === 'saving'">{{ store.status() === 'saving' ? 'Saving…' : 'Save recipe' }}</button>
          <a class="button ghost" [routerLink]="id() ? ['/recipes', id()] : ['/recipes']">Cancel</a>
        </div>
      </form>
    }
  `,
  styles: `
    .back { display: inline-block; margin-bottom: 16px; text-decoration: none; font-weight: 500; }
    .editor { display: flex; flex-direction: column; gap: 16px; max-width: 820px; }
    .error-summary { padding: 12px 16px; border-color: var(--danger); background: var(--danger-soft); }
    .error-summary ul { margin: 6px 0 0; padding-left: 20px; }
    .numbers { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
    .rows { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
    .ingredient-row { display: grid; grid-template-columns: 72px 92px minmax(0, 2fr) minmax(0, 1.2fr) auto; gap: 8px; align-items: center; }
    @media (max-width: 640px) { .ingredient-row { grid-template-columns: 64px 84px minmax(0, 1fr) auto; } .ingredient-row .note { display: none; } }
    .step-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; align-items: start; counter-increment: step; }
    .paste textarea { font-family: inherit; }
    .actions { justify-content: flex-start; }
  `,
})
export class RecipeEditorPage implements OnInit {
  /** Set when editing; absent when creating. */
  readonly id = input<string>();
  protected readonly store = inject(RecipeEditorStore);
  protected readonly units = UNITS;
  protected readonly pasting = signal(false);

  ngOnInit(): void {
    const id = this.id();
    if (id) this.store.edit(id);
  }

  protected heading(): string {
    return this.id() ? `Edit ${this.store.form().title || 'recipe'}` : 'New recipe';
  }

  protected errorMessages(): string[] {
    const e = this.store.errors();
    const quantity = Object.keys(e.quantities).length ? ['Some quantities aren’t numbers'] : [];
    return [e.title, e.servings, e.ingredients, e.steps, ...quantity].filter((m): m is string => !!m);
  }

  protected show(error: string | undefined): boolean {
    return this.store.submitted() && !!error;
  }

  protected set<K extends keyof RecipeForm>(field: K, value: RecipeForm[K]): void {
    this.store.setField(field, value);
  }

  protected value(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected number(event: Event): number | null {
    const raw = (event.target as HTMLInputElement).value;
    return raw === '' ? null : Number(raw);
  }

  protected addPasted(textarea: HTMLTextAreaElement): void {
    this.store.addIngredientsFromText(textarea.value);
    textarea.value = '';
    this.pasting.set(false);
  }
}
