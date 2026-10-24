import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RecipeSummary } from '../../../core/api/models';

@Component({
  selector: 'app-recipe-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    @let r = recipe();
    <article class="recipe-card card" [attr.aria-labelledby]="'recipe-' + r.id">
      <div class="swatch" [style.--hue]="hue()" aria-hidden="true">{{ r.title.charAt(0) }}</div>
      <div class="body">
        <div class="row top">
          <h2 [id]="'recipe-' + r.id"><a [routerLink]="['/recipes', r.id]">{{ r.title }}</a></h2>
          <button
            type="button"
            class="icon star"
            [attr.aria-pressed]="r.favorite"
            [attr.aria-label]="(r.favorite ? 'Remove ' : 'Add ') + r.title + (r.favorite ? ' from favourites' : ' to favourites')"
            (click)="favoriteToggled.emit()"
          >
            {{ r.favorite ? '★' : '☆' }}
          </button>
        </div>
        <p class="muted description">{{ r.description }}</p>
        <div class="row meta">
          <span>{{ totalMinutes() }} min</span>
          <span aria-hidden="true">·</span>
          <span>Serves {{ r.servings }}</span>
        </div>
        <div class="row tags">
          @for (tag of r.tags; track tag) {
            <span class="chip">{{ tag }}</span>
          }
        </div>
      </div>
    </article>
  `,
  styles: `
    .recipe-card { display: flex; flex-direction: column; overflow: hidden; height: 100%; }
    .swatch {
      height: 88px; display: grid; place-items: center; font-size: 34px; font-weight: 700;
      color: hsl(var(--hue) 45% 30%); background: hsl(var(--hue) 55% 88%);
    }
    @media (prefers-color-scheme: dark) { .swatch { color: hsl(var(--hue) 60% 80%); background: hsl(var(--hue) 30% 22%); } }
    .body { padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
    .top { justify-content: space-between; flex-wrap: nowrap; align-items: flex-start; }
    h2 { font-size: 16px; }
    h2 a { color: inherit; text-decoration: none; }
    h2 a::after { content: ''; position: absolute; inset: 0; }
    .recipe-card { position: relative; }
    .star { position: relative; z-index: 1; font-size: 18px; color: var(--warning); }
    .description { font-size: 14px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .meta { color: var(--muted); font-size: 13px; gap: 6px; }
    .tags { gap: 6px; margin-top: auto; }
  `,
})
export class RecipeCardComponent {
  readonly recipe = input.required<RecipeSummary>();
  readonly favoriteToggled = output<void>();

  protected readonly totalMinutes = computed(() => this.recipe().prepMinutes + this.recipe().cookMinutes);
  /** A stable colour per recipe for its placeholder image. */
  protected readonly hue = computed(() => [...this.recipe().id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7));
}
