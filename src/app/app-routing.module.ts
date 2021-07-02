import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ItemsListComponent } from './items-list/items-list.component';
import { SelectListComponent } from './select-list/select-list.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'items',
  },
  {
    path: 'items',
    component: ItemsListComponent
  },
  {
    path: 'lists',
    component: SelectListComponent,
    data: { title: 'Your Lists' },
  },
  {
    path: 'need',
    redirectTo: 'items',
  },
  {
    path: 'have',
    redirectTo: 'items',
  },
  { path: 'recipies', loadChildren: () => import('./recipies/recipies.module').then(m => m.RecipiesModule) }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
