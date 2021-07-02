import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RecipiesRoutingModule } from './recipies-routing.module';
import { RecipiesComponent } from './recipies.component';
import {MatCardModule} from '@angular/material/card';

@NgModule({
  declarations: [
    RecipiesComponent
  ],
  imports: [
    CommonModule,
    RecipiesRoutingModule,
    MatCardModule,
  ]
})
export class RecipiesModule { }
