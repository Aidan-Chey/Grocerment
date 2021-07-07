import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { of, from, iif } from 'rxjs';
import { debounceTime, filter, first, map, shareReplay, switchMap, tap, toArray } from 'rxjs/operators';
import { Item } from '@grocerment-models/item.model';
import { ListService } from '@grocerment-services/list.service';
import { RecipeDetails, SpoonacularApiService } from '@grocerment-recipes/spoonacular-api.service';
import { RecipeDetailsDialog } from '@grocerment-recipes/recipe-details/recipe-details.dialog';

@Injectable()
export class RecipesService {
  /** Cache of recipies retrieved this session to avoid unnecessary re-fetching */
  private readonly recipesCache = {} as { [key: number]: RecipeDetails };
  /** List of items from the active list the user "has" */
  public readonly itemsHave$ = this.listService.items$.pipe(
    debounceTime(50),
    switchMap( (store) => {
      if ( !Array.isArray(store) || !store.length ) return of([] as Item[]); 
      return from(store).pipe(
        // Filter out non-obtained items
        filter( item => !!item.obtained ),
        toArray(),
      );
    } ),
    shareReplay(1),
  );

  constructor(
    private readonly listService: ListService,
    private readonly spoonacularAPI: SpoonacularApiService,
    private readonly dialog: MatDialog,
  ) { }
  
  /** Generates list of recipes based on avaliable ingredients */
  getRecipes() {

    // Retrieve avaliable ingredients
    return this.itemsHave$.pipe(
      // Convert list of items to list of names
      switchMap( items => from(items).pipe(
        map( item => item.name ),
        toArray(),
      ) ),
      first(),
      // Fetch recipes
      switchMap( ingredients => this.spoonacularAPI.fetchRecipesByIngredients({
        ingredients,
        limitLicense: false,
        ranking: 0,
        ignorePantry: true,
      }) ),
      first(),
    );

  }

  /** Displays input recipe in a dialog */
  showRecipe( id: number ): void {
    // Check to see if the recipie is already cached
    const cachedRecipe = this.recipesCache[id];
    const retrieveRecipe$ = this.spoonacularAPI.fetchRecipeById( id ).pipe(
      // cache the recipie for later retrieval
      tap( recipe => { this.recipesCache[id] = recipe; } ),
    );
    // get recipie from cache if exists, otherwise retrive from API
    iif( () => !!cachedRecipe, of(cachedRecipe), retrieveRecipe$ ).subscribe( recipe => {
      this.dialog.open( RecipeDetailsDialog, { data: recipe } );
    } );
  }

}
