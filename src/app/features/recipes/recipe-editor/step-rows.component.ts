import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RecipeEditorStore } from '../data-access/recipe-editor.store';

/** The method, one step per row. */
@Component({
  selector: 'app-step-rows',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="card card-body stack" aria-labelledby="steps-heading">
      <h2 id="steps-heading">Method</h2>
      <ol class="rows">
        @for (step of store.steps(); track step.key; let i = $index) {
          <li class="step-row">
            <textarea rows="2" [attr.aria-label]="'Step ' + (i + 1)" [value]="step.text" (input)="store.updateStep(step.key, $any($event.target).value)"></textarea>
            <button type="button" class="icon" [attr.aria-label]="'Remove step ' + (i + 1)" (click)="store.removeStep(step.key)">×</button>
          </li>
        }
      </ol>
      <div class="row"><button type="button" (click)="store.addStep()">Add step</button></div>
    </section>
  `,
  styles: `
    .rows { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
    .step-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; align-items: start; }
  `,
})
export class StepRowsComponent {
  protected readonly store = inject(RecipeEditorStore);
}
