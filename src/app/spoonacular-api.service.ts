import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { filter, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import notEmpty from './globals/not-empty-filter';
import { Spoonacular } from './models/spoonacular.model';

@Injectable({
  providedIn: 'root'
})
export class SpoonacularApiService {

  private baseUrl = 'https://api.spoonacular.com';
  /** Reference to the soonacular collection */
  private readonly spoonacularCollectionRef$ = this.afAuth.user.pipe(
    filter( notEmpty ),
    map( user => this.firestore.collection<Spoonacular>('spoonacular') ),
    shareReplay(1),
  );
  /** spoonacular details stored in database */
  private readonly details$ = this.spoonacularCollectionRef$.pipe(
    switchMap( ref => ref.doc("details").get() ),
    map( document => document.exists ? document.data() : undefined ),
    shareReplay(1),
  );

  constructor(
    private readonly firestore: AngularFirestore,
    private readonly afAuth: AngularFireAuth,
    private readonly http: HttpClient,
  ) { }

  /** Fetches a list of receipies from spoonacular's API depeding on supplied ingredients */
  fetchRecipiesByIngredients( params: RecipieByIngredientsParams ): Observable<FetchedRecipieByIngredients[]> {

    console.log(params);

    const url = new URL( '/recipes/findByIngredients', this.baseUrl );
    if ( !Array.isArray(params.ingredients) ) throw Error('No ingredients to search recipies with');

    return this.details$.pipe(
      switchMap( details => {

        const queryParams: Record<string,string> = {
          ingredients: params.ingredients.join(','),
        };

        if( !details?.apikey ) throw Error('Attempted to retrieve recipies from spoonacular without API key');
        else queryParams.apiKey = details.apikey;
        
        if( params.hasOwnProperty('number') && params.number != null ) queryParams.number = params.number.toString();
        if( params.hasOwnProperty('ranking') && params.ranking != null ) queryParams.ranking = params.ranking.toString();
        if( params.hasOwnProperty('limitLicense') && params.limitLicense != null ) queryParams.limitLicense = params.limitLicense.toString();
        if( params.hasOwnProperty('ignorePantry') && params.ignorePantry != null ) queryParams.ignorePantry = params.ignorePantry.toString();

        url.search = new URLSearchParams(queryParams).toString();

        return this.http.get<FetchedRecipieByIngredients[]>(url.toString());

      } ),
    );

  }

}

export interface RecipieByIngredientsParams {
  /** List of ingredients that the recipes should contain. */
  ingredients: string[]
  /** Maximum number of recipes to return (between 1 and 100). Defaults to 10. */
  number?: number
  /** Whether the recipes should have an open license that allows display with proper attribution. */
  limitLicense?: boolean
  /** Whether to maximize used ingredients (1) or minimize missing ingredients (2) first. */
  ranking?: number
  /** Whether to ignore typical pantry items, such as water, salt, flour, etc. */
  ignorePantry?: boolean
}

// Generated by https://quicktype.io
export interface FetchedRecipieByIngredients {
  id:                    number;
  title:                 string;
  image:                 string;
  imageType:             ImageType;
  usedIngredientCount:   number;
  missedIngredientCount: number;
  missedIngredients:     Ingredient[];
  usedIngredients:       Ingredient[];
  unusedIngredients:     any[];
  likes:                 number;
}

export interface Ingredient {
  id:              number;
  amount:          number;
  unit:            string;
  unitLong:        string;
  unitShort:       string;
  aisle:           string;
  name:            string;
  original:        string;
  originalString:  string;
  originalName:    string;
  metaInformation: string[];
  meta:            string[];
  extendedName?:   string;
  image:           string;
}

export enum ImageType {
  Jpg = "jpg",
}
