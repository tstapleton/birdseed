import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { StepperComponent } from '../../../shared/ui/stepper.component';
import { ScaledIngredient } from '../data-access/recipe-detail.store';

/** Ingredients scaled to the servings, with a stepper to change them. */
@Component({
  selector: 'app-ingredients-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StepperComponent],
  template: `
    <section class="card card-body" aria-labelledby="ingredients-title">
      <div class="row head">
        <h2 id="ingredients-title">Ingredients</h2>
        <span class="spacer"></span>
        <app-stepper label="Servings" lessLabel="Fewer servings" moreLabel="More servings" unit="servings"
          [value]="servings()" (changed)="servingsChange.emit($event)" />
      </div>
      <ul class="ingredients" aria-label="Ingredients">
        @for (ingredient of ingredients(); track $index) {
          <li>
            <span class="amount">{{ ingredient.amount }}</span>&ngsp;<span>{{ ingredient.name }}@if (ingredient.note) {<span class="muted">, {{ ingredient.note }}</span>}</span>
          </li>
        }
      </ul>
    </section>
  `,
  styles: `
    .head { margin-bottom: 12px; }
    .ingredients { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
    .ingredients li { display: flex; gap: 10px; }
    .amount { min-width: 64px; font-weight: 600; font-variant-numeric: tabular-nums; }
  `,
})
export class IngredientsCardComponent {
  readonly ingredients = input.required<ScaledIngredient[]>();
  readonly servings = input.required<number>();
  readonly servingsChange = output<number>();
}
