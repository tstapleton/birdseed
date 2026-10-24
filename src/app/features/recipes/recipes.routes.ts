import { Routes } from '@angular/router';
import { RecipeDetailPage } from './recipe-detail/recipe-detail.page';
import { RecipeListPage } from './recipe-list/recipe-list.page';

export const RECIPES_ROUTES: Routes = [
  { path: '', component: RecipeListPage, title: 'Recipes · Kitchen' },
  { path: ':id', component: RecipeDetailPage, title: 'Recipe · Kitchen' },
];
