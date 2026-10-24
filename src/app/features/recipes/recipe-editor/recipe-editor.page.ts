import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RecipeEditorStore } from '../data-access/recipe-editor.store';
import { DetailsFieldsComponent } from './details-fields.component';
import { ErrorSummaryComponent } from './error-summary.component';
import { IngredientRowsComponent } from './ingredient-rows.component';
import { StepRowsComponent } from './step-rows.component';

@Component({
  selector: 'app-recipe-editor-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DetailsFieldsComponent, ErrorSummaryComponent, IngredientRowsComponent, StepRowsComponent],
  providers: [RecipeEditorStore],
  template: `
    <a class="back" [routerLink]="backLink()">← {{ id() ? 'Back to recipe' : 'All recipes' }}</a>

    @if (store.status() === 'loading') {
      <p class="empty" role="status">Loading recipe…</p>
    } @else if (store.status() === 'missing') {
      <p class="empty" role="alert">That recipe doesn't exist.</p>
    } @else {
      <form class="editor" novalidate [attr.aria-label]="heading()" (submit)="$event.preventDefault(); store.save()">
        <h1>{{ heading() }}</h1>
        @if (store.submitted() && !store.valid()) {
          <app-error-summary heading="Check the recipe before saving:" [messages]="errorMessages()" />
        }
        <app-details-fields />
        <app-ingredient-rows />
        <app-step-rows />
        <div class="row">
          <button type="submit" class="primary" [disabled]="store.status() === 'saving'">{{ store.status() === 'saving' ? 'Saving…' : 'Save recipe' }}</button>
          <a class="button ghost" [routerLink]="backLink()">Cancel</a>
        </div>
      </form>
    }
  `,
  styles: `
    .back { display: inline-block; margin-bottom: 16px; text-decoration: none; font-weight: 500; }
    .editor { display: flex; flex-direction: column; gap: 16px; max-width: 820px; }
  `,
})
export class RecipeEditorPage implements OnInit {
  /** Set when editing; absent when creating. */
  readonly id = input<string>();
  protected readonly store = inject(RecipeEditorStore);

  protected readonly backLink = computed(() => (this.id() ? ['/recipes', this.id()] : ['/recipes']));
  protected readonly heading = computed(() => (this.id() ? `Edit ${this.store.form().title || 'recipe'}` : 'New recipe'));
  protected readonly errorMessages = computed(() => {
    const e = this.store.errors();
    const quantity = Object.keys(e.quantities).length ? ['Some quantities aren’t numbers'] : [];
    return [e.title, e.servings, e.ingredients, e.steps, ...quantity].filter((m): m is string => !!m);
  });

  ngOnInit(): void {
    const id = this.id();
    if (id) void this.store.edit(id);
  }
}
