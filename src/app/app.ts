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
          <path d="M3 11h18a9 9 0 0 1-18 0Z" fill="currentColor" />
          <path d="M8 7c0-1.5 1.5-1.5 1.5-3M12.5 7c0-1.5 1.5-1.5 1.5-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
        </svg>
        Kitchen
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
