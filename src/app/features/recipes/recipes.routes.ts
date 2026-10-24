import { Routes } from '@angular/router';
import { RecipeDetailPage } from './recipe-detail/recipe-detail.page';
import { RecipeEditorPage } from './recipe-editor/recipe-editor.page';
import { RecipeListPage } from './recipe-list/recipe-list.page';

export const RECIPES_ROUTES: Routes = [
  { path: '', component: RecipeListPage, title: 'Recipes · Kitchen' },
  { path: 'new', component: RecipeEditorPage, title: 'New recipe · Kitchen' },
  { path: ':id', component: RecipeDetailPage, title: 'Recipe · Kitchen' },
  { path: ':id/edit', component: RecipeEditorPage, title: 'Edit recipe · Kitchen' },
];
