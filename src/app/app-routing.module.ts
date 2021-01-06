import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ListHaveComponent } from './list-have/list-have.component';
import { ListNeedComponent } from './list-need/list-need.component';
import { NewItemComponent } from './new-item/new-item.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'need',
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
