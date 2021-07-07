import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { recipesRoutingModule } from './recipes-routing.module';
import { RecipesComponent } from './recipes.component';
import {MatExpansionModule} from '@angular/material/expansion';
import { RecipesService } from './recipes.service';
import { SpoonacularApiService } from './spoonacular-api.service';
import { RecipeDetailsDialog } from './recipe-details/recipe-details.dialog';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@NgModule({
  declarations: [
    RecipesComponent,
    RecipeDetailsDialog
  ],
  imports: [
    CommonModule,
    recipesRoutingModule,
    MatExpansionModule,
    MatDialogModule,
  ],
  providers: [
    RecipesService,
    SpoonacularApiService,
    { provide: MAT_DIALOG_DATA, useValue: {} },
    { provide: MatDialogRef, useValue: {} },
  ],
})
export class RecipesModule { }
