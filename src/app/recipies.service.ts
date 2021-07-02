import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { from } from 'rxjs';
import { debounceTime, filter, first, map, shareReplay, switchMap, toArray } from 'rxjs/operators';
import notEmpty from './globals/not-empty-filter';
import { Item } from './models/item.model';
import { ListService } from './services/list.service';
import { SpoonacularApiService } from './spoonacular-api.service';

@Injectable({
  providedIn: 'root'
})
export class RecipiesService {

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
  ) { }
  
  /* Generates list of recipies based on avaliable ingredients */
  getRecipies() {

    // Retrieve avaliable ingredients
    return this.itemsHave$.pipe(
      // Convert list of items to list of names
      switchMap( items => from(items).pipe(
        map( item => item.name ),
        toArray(),
      ) ),
      first(),
      // Fetch recipies
      switchMap( ingredients => this.spoonacularAPI.fetchRecipiesByIngredients({
        ingredients,
        limitLicense: false,
        ranking: 0,
        ignorePantry: true,
      }) ),
      first(),
    );

  }

}
