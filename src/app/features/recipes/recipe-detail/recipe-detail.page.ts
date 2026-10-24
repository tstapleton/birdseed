import { ChangeDetectionStrategy, Component, OnInit, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RecipeDetailStore } from '../data-access/recipe-detail.store';

@Component({
  selector: 'app-recipe-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  providers: [RecipeDetailStore],
  template: `
    <a class="back" routerLink="/recipes">← All recipes</a>

    @switch (store.status()) {
      @case ('loading') {
        <p class="empty" role="status">Loading recipe…</p>
      }
      @case ('missing') {
        <div class="empty" role="alert">
          <p>That recipe doesn't exist. It may have been deleted.</p>
          <a class="button" routerLink="/recipes">Back to recipes</a>
        </div>
      }
      @case ('error') {
        <div class="empty" role="alert">
          <p>The recipe could not be loaded.</p>
          <button type="button" (click)="store.load(id())">Try again</button>
        </div>
      }
    }

    @if (store.recipe(); as recipe) {
      <article class="recipe" [attr.aria-labelledby]="'title'">
        <header class="head">
          <div class="stack">
            <h1 id="title">{{ recipe.title }}</h1>
            <p class="muted">{{ recipe.description }}</p>
            <div class="row">
              @for (tag of recipe.tags; track tag) {
                <span class="chip">{{ tag }}</span>
              }
            </div>
            <dl class="times">
              <div><dt>Prep</dt><dd>{{ recipe.prepMinutes }} min</dd></div>
              <div><dt>Cook</dt><dd>{{ recipe.cookMinutes }} min</dd></div>
              <div><dt>Total</dt><dd>{{ store.totalMinutes() }} min</dd></div>
            </dl>
          </div>
          <div class="actions row">
            <button type="button" class="primary" [attr.aria-expanded]="store.shopping().open" (click)="store.shopping().open ? store.closeShopping() : store.openShopping()">
              Add to grocery list
            </button>
            <a class="button" [routerLink]="['/recipes', recipe.id, 'edit']">Edit</a>
            <button type="button" class="danger" (click)="store.askToDelete()">Delete</button>
          </div>
        </header>

        @if (store.deletion() !== 'idle') {
          <div class="confirm card" role="alertdialog" aria-labelledby="confirm-title">
            <p id="confirm-title"><strong>Delete {{ recipe.title }}?</strong> It will also come off your meal plan. This can't be undone.</p>
            <div class="row">
              <button type="button" class="danger solid" [disabled]="store.deletion() === 'deleting'" (click)="store.delete()">Delete recipe</button>
              <button type="button" (click)="store.cancelDelete()">Cancel</button>
            </div>
          </div>
        }

        @if (store.shopping().open) {
          <form class="panel card card-body" aria-label="Add to grocery list" (submit)="$event.preventDefault(); addToList()">
            @if (store.shopping().status === 'loading') {
              <p role="status">Loading your lists…</p>
            } @else {
              <div class="row">
                <div class="field">
                  <label for="list-choice">Grocery list</label>
                  <select id="list-choice" (change)="choice.set($any($event.target).value)">
                    @for (list of store.shopping().lists; track list.id) {
                      <option [value]="list.id" [selected]="list.id === choice()">{{ list.name }}</option>
                    }
                    <option value="new" [selected]="choice() === 'new'">New list…</option>
                  </select>
                </div>
                @if (choice() === 'new') {
                  <div class="field">
                    <label for="new-list-name">New list name</label>
                    <input id="new-list-name" [value]="newListName() || recipe.title" (input)="newListName.set($any($event.target).value)" />
                  </div>
                }
              </div>
              <p class="muted">Adds {{ store.ingredients().length }} ingredients for {{ store.servings() }} servings. Anything already on the list is topped up.</p>
              <div class="row">
                <button type="submit" class="primary" [disabled]="store.shopping().status === 'adding'">Add ingredients</button>
                <button type="button" (click)="store.closeShopping()">Cancel</button>
              </div>
            }
          </form>
        }

        <div class="columns">
          <section class="card card-body" aria-labelledby="ingredients-title">
            <div class="row section-head">
              <h2 id="ingredients-title">Ingredients</h2>
              <span class="spacer"></span>
              <div class="stepper row" role="group" aria-label="Servings">
                <button type="button" class="icon" aria-label="Fewer servings" [disabled]="store.servings() <= 1" (click)="store.setServings(store.servings() - 1)">−</button>
                <span aria-live="polite"><strong>{{ store.servings() }}</strong> servings</span>
                <button type="button" class="icon" aria-label="More servings" (click)="store.setServings(store.servings() + 1)">+</button>
              </div>
            </div>
            <ul class="ingredients" aria-label="Ingredients">
              @for (ingredient of store.ingredients(); track $index) {
                <li>
                  <span class="amount">{{ ingredient.amount }}</span>&ngsp;<span>{{ ingredient.name }}@if (ingredient.note) {<span class="muted">, {{ ingredient.note }}</span>}</span>
                </li>
              }
            </ul>
          </section>

          <section class="card card-body" aria-labelledby="method-title">
            <h2 id="method-title" class="section-head">Method</h2>
            <ol class="steps">
              @for (step of recipe.steps; track $index) {
                <li>{{ step }}</li>
              }
            </ol>
          </section>
        </div>
      </article>
    }
  `,
  styles: `
    .back { display: inline-block; margin-bottom: 16px; text-decoration: none; font-weight: 500; }
    .head { display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
    .head .stack { max-width: 640px; }
    .times { display: flex; gap: 24px; margin: 4px 0 0; }
    .times dt { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); }
    .times dd { margin: 0; font-weight: 600; }
    .actions { align-self: flex-start; }
    .confirm { padding: 14px 16px; margin-bottom: 20px; border-color: var(--danger); background: var(--danger-soft); display: flex; flex-direction: column; gap: 10px; }
    .panel { margin-bottom: 20px; display: flex; flex-direction: column; gap: 12px; }
    .panel .row { align-items: flex-end; }
    .columns { display: grid; gap: 16px; grid-template-columns: minmax(0, 2fr) minmax(0, 3fr); }
    @media (max-width: 760px) { .columns { grid-template-columns: 1fr; } }
    .section-head { margin-bottom: 12px; }
    .stepper { gap: 4px; background: var(--surface-2); border-radius: 999px; padding: 2px 4px; }
    .ingredients { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
    .ingredients li { display: flex; gap: 10px; }
    .amount { min-width: 64px; font-weight: 600; font-variant-numeric: tabular-nums; }
    .steps { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 12px; }
    .empty { display: flex; flex-direction: column; align-items: center; gap: 12px; }
  `,
})
export class RecipeDetailPage implements OnInit {
  readonly id = input.required<string>();
  protected readonly store = inject(RecipeDetailStore);
  /** The list picked in the panel: a list id, or 'new'. */
  protected readonly choice = signal('new');
  protected readonly newListName = signal('');

  constructor() {
    // Default to the newest list once the panel has loaded them.
    effect(() => {
      const { status, lists } = this.store.shopping();
      if (status === 'ready') this.choice.set(lists[0]?.id ?? 'new');
    });
  }

  ngOnInit(): void {
    this.store.load(this.id());
  }

  protected addToList(): void {
    const choice = this.choice();
    this.store.addToGroceryList(choice === 'new' ? { newListName: this.newListName() || this.store.recipe()!.title } : { listId: choice });
  }
}
