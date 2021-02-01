import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ListHaveComponent } from './list-have/list-have.component';
import { ListNeedComponent } from './list-need/list-need.component';
import { SelectListComponent } from './select-list/select-list.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'need',
  },
  {
    path: 'lists',
    component: SelectListComponent,
    data: { title: 'Switch Lists' },
  },
  {
    path: 'need',
    component: ListNeedComponent,
    data: { title: 'I Need...' },
  },
  {
    path: 'have',
    component: ListHaveComponent,
    data: { title: 'I Have...' },
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
