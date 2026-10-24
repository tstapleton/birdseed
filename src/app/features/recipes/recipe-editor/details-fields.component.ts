import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RecipeEditorStore, RecipeForm } from '../data-access/recipe-editor.store';

/** Name, description, servings, times and tags. */
@Component({
  selector: 'app-details-fields',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="card card-body stack" aria-label="Details">
      <div class="field">
        <label for="title">Name</label>
        <input id="title" [value]="store.form().title" (input)="set('title', text($event))" [attr.aria-invalid]="store.submitted() && !!store.errors().title" />
      </div>
      <div class="field">
        <label for="description">Description</label>
        <textarea id="description" rows="2" [value]="store.form().description" (input)="set('description', text($event))"></textarea>
      </div>
      <div class="numbers">
        <div class="field">
          <label for="servings">Servings</label>
          <input id="servings" type="number" min="1" [value]="store.form().servings ?? ''" (input)="set('servings', number($event))"
            [attr.aria-invalid]="store.submitted() && !!store.errors().servings" />
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
        <input id="tags" placeholder="dinner, vegetarian, quick" [value]="store.form().tags" (input)="set('tags', text($event))" />
      </div>
    </section>
  `,
  styles: `
    .numbers { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
  `,
})
export class DetailsFieldsComponent {
  protected readonly store = inject(RecipeEditorStore);

  protected set<K extends keyof RecipeForm>(field: K, value: RecipeForm[K]): void {
    this.store.setField(field, value);
  }

  protected text(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected number(event: Event): number | null {
    const raw = (event.target as HTMLInputElement).value;
    return raw === '' ? null : Number(raw);
  }
}
