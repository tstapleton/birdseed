import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ToastOutletComponent } from './core/notifications/toast-outlet.component';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastOutletComponent],
  template: `
    <header class="app-header">
      <a class="brand" routerLink="/recipes">
        <svg class="brand-mark" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <ellipse cx="8" cy="15" rx="3.2" ry="5" transform="rotate(-30 8 15)" fill="currentColor" />
          <ellipse cx="16.5" cy="13" rx="3.2" ry="5" transform="rotate(25 16.5 13)" fill="currentColor" opacity="0.75" />
          <ellipse cx="12" cy="6" rx="2.6" ry="4" transform="rotate(-5 12 6)" fill="currentColor" opacity="0.5" />
        </svg>
        Birdseed
      </a>
      <nav aria-label="Main">
        <a routerLink="/recipes" routerLinkActive="active">Recipes</a>
        <a routerLink="/plan" routerLinkActive="active">Meal plan</a>
        <a routerLink="/groceries" routerLinkActive="active">Groceries</a>
      </nav>
    </header>
    <main class="app-main">
      <router-outlet />
    </main>
    <app-toast-outlet />
  `,
})
export class App {}
