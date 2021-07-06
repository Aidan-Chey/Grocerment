import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RecipiesRoutingModule } from './recipies-routing.module';
import { RecipiesComponent } from './recipies.component';
import {MatExpansionModule} from '@angular/material/expansion';

@NgModule({
  declarations: [
    RecipiesComponent
  ],
  imports: [
    CommonModule,
    RecipiesRoutingModule,
    MatExpansionModule,
  ]
})
export class RecipiesModule { }
