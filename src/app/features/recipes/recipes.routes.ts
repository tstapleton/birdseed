import { Routes } from '@angular/router';
import { RecipesStore } from './data-access/recipes.store';
import { RecipeListPage } from './recipe-list/recipe-list.page';

export const RECIPES_ROUTES: Routes = [
  { path: '', component: RecipeListPage, providers: [RecipesStore], title: 'Recipes · Kitchen' },
];
