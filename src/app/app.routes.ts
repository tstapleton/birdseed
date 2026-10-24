import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'recipes' },
  { path: 'recipes', loadChildren: () => import('./features/recipes/recipes.routes').then((m) => m.RECIPES_ROUTES) },
  { path: 'groceries', loadChildren: () => import('./features/groceries/groceries.routes').then((m) => m.GROCERIES_ROUTES) },
  { path: '**', redirectTo: 'recipes' },
];
