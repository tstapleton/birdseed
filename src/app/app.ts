import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ToastOutletComponent } from './core/notifications/toast-outlet.component';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastOutletComponent],
  template: `
    <header class="app-header">
      <a class="brand" routerLink="/recipes"><span class="brand-mark" aria-hidden="true">◐</span>Kitchen</a>
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
