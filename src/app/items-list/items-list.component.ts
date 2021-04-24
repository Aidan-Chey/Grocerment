import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Item } from '@grocerment-app/models/item.model';
import { ListService } from '@grocerment-app/services/list.service';
import { BehaviorSubject, combineLatest, EMPTY, from, Observable, of, Subject } from 'rxjs';
import { auditTime, catchError, debounceTime, filter, first, map, share, shareReplay, switchMap, takeUntil, toArray } from 'rxjs/operators';
import * as Sentry from "@sentry/angular";
import { environment } from 'src/environments/environment';
import { FilterService } from '@grocerment-app/services/filter.service';
import notEmpty from '@grocerment-app/globals/not-empty-filter';
import { AngularFireAuth } from '@angular/fire/auth';

@Component({
  selector: 'app-items-list',
  templateUrl: './items-list.component.html',
  styleUrls: ['./items-list.component.scss']
})
export class ItemsListComponent implements OnInit {
  
  private readonly componentDestruction$ = new Subject();
  /** localstorage key the cart items are stored under */
  private readonly cartitemsLabel = 'basket';

  /** list of items from the store */
  private readonly itemsStore$ = this.listService.listsCollectionRef$.pipe( // Get logged in user UID
    auditTime(50),
    // Use UID to get their items
    switchMap( ref => ref
      .doc(this.listService.activeList?.id)
      .collection<Item>('items')
      .valueChanges({idField: 'id'}) 
    ),
    catchError( err => {
      const issue = 'Failed to retrieve items';
      if ( environment.production ) Sentry.captureException(err);
      else console.error(issue + ' |', err);
      this.snackbar.open( issue, 'Dismiss', { duration: 3000, verticalPosition: 'bottom' } );
      return EMPTY;
    } ),
    map( items => items.sort(this.compareFn) ),
    shareReplay(1),
  );
  
  /** Items the user has */
  public readonly itemsHave$ = combineLatest([
    this.itemsStore$,
    this.filterService.filterTerm$,
  ]).pipe(
    debounceTime(50),
    switchMap( ([store,term]) => Array.isArray(store) ? from(store).pipe(
      // Filter out items with non-matching names & are obtained
      filter( item => !!item.name.toLowerCase().includes(term.toLowerCase()) && !!item.obtained ),
      toArray(),
    ) : of([]) ),
    shareReplay(1),
  );
  private readonly cartItemRefs$ = new BehaviorSubject<string[]>([]);
  public readonly cartItems$ = combineLatest([
    this.cartItemRefs$,
    this.itemsStore$,
  ]).pipe(
    switchMap( ([references,items]) => {
      const output = [] as Item[];
      if ( !Array.isArray(references) || !Array.isArray(items) ) return of(output);
      return from(references).pipe(
        map( ref => items.find( item => item.id === ref ) ),
        filter( notEmpty ),
        toArray(),
      );
    }),
    shareReplay(1),
  );
  
  /** Items the user needs */
  public readonly itemsNeed$ = combineLatest([
    this.itemsStore$,
    this.cartItems$,
    this.filterService.filterTerm$,
  ]).pipe(
    debounceTime(50),
    switchMap( ([store,cart,term]) => {
      const output = {} as { [key: string]: Item[] };
      if ( !Array.isArray(store) || !store.length ) return of(output);
      return from(store).pipe(
        // Filter out items with non-matching names or that are in the cart
        filter( item => (!term || !!item.name.toLowerCase().includes(term.toLowerCase())) && cart.every( i => i.id !== item.id ) && !item.obtained ),
        map( item => {
          // add new property to ouput object of item category as an array
          if ( !output.hasOwnProperty(item.category) ) output[item.category] = [];
          // add the item to the array of the matching category property
          output[item.category].push(item);
        } ),
        toArray(),
        map( () => output ),
      ) as Observable<{ [key: string]: Item[] }>;
    }),
    shareReplay(1),
  );

  public readonly editItemRef$ = new BehaviorSubject<number|undefined>(undefined);
  public readonly edititem$ = combineLatest([
    this.itemsStore$,
    this.editItemRef$,
  ]).pipe(
    map( ([items,edit]) => {
      if ( !edit ) return undefined;
      return items.find( item => item.id === edit.toString() );
    } ),
    shareReplay(1),
  );

  constructor(
    private readonly listService: ListService,
    private readonly snackbar: MatSnackBar,
    private readonly filterService: FilterService,
    private readonly afAuth: AngularFireAuth,
  ) {
    const basket = localStorage.getItem(this.cartitemsLabel);
    if ( !!basket && basket !== 'undefined' ) {
      this.cartItemRefs$.next( JSON.parse(basket) );
    }

    // Removes localstorage & clears variables on logout
    this.afAuth.user.pipe(
      filter(res => !res),
    ).subscribe( () => {
      localStorage.removeItem(this.cartitemsLabel);
      this.cartItemRefs$.next([]);
    } );
  }

  ngOnInit(): void {

    // Indicates to the header that a list is filterable
    this.itemsStore$.subscribe( items => {
      this.filterService.filterable = (Array.isArray(items) && !!items.length);
    } );

    this.cartItemRefs$.pipe(
      takeUntil(this.componentDestruction$),
    ).subscribe( data => {
      if ( !!data ) localStorage.setItem(this.cartitemsLabel,JSON.stringify(data));
      else localStorage.removeItem(this.cartitemsLabel);
    } );

  }

  ngOnDestroy() {
    this.filterService.filterable = false;
    this.componentDestruction$.next();
  }

  /** Function to compare two objects by comparing their `name` property. */
  private compareFn(a: Item, b: Item) {
    if (a.name < b.name)
      return -1;
    if (a.name > b.name)
      return 1;
    return 0;
  };

  /** Tracks items by their ID */
  public trackByItemID(index:number, el:any): number {
    return el.id;
  }

}
