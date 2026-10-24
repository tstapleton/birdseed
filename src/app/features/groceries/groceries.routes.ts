import { Routes } from '@angular/router';
import { GroceryListPage } from './grocery-list/grocery-list.page';
import { GroceryListsPage } from './grocery-lists/grocery-lists.page';

export const GROCERIES_ROUTES: Routes = [
  { path: '', component: GroceryListsPage, title: 'Grocery lists · Birdseed' },
  { path: ':id', component: GroceryListPage, title: 'Grocery list · Birdseed' },
];
