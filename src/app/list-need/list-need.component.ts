import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { auditTime, catchError, debounceTime, map, shareReplay, switchMap } from 'rxjs/operators';
import { FilterService } from '../services/filter.service';
import { Item } from '../models/item.model';
import { of } from 'rxjs';
import { EMPTY } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from 'src/environments/environment';
import * as Sentry from "@sentry/angular";
import { ListService } from '../services/list.service';
import { ItemService } from '../services/item.service';

@Component({
  selector: 'app-list-need',
  templateUrl: './list-need.component.html',
  styleUrls: ['./list-need.component.scss']
})
export class ListNeedComponent implements OnInit, OnDestroy {
  public readonly cartItems$ = new BehaviorSubject<Item[]>([]);

  /** List of items from the store */
  private readonly itemsStore$ = this.listService.listsCollectionRef$.pipe( // Get logged in user UID
    auditTime(50),
    // Use UID to get their items
    switchMap( ref => !!ref ? ref
      .doc(this.listService.activeList?.id)
      .collection<Item>('items',ref => ref.where( 'obtained', '==', false ) )
      .valueChanges({idField: 'id'}) 
    : of(undefined)
    ),
    catchError( err => {
      const issue = 'Failed to retrieve items';
      if ( environment.production ) Sentry.captureException(err);
      else console.error(issue + ' |', err);
      this.snackbar.open( issue, 'Dismiss', { duration: 3000, verticalPosition: 'top' } );
      return EMPTY;
    } ),
    shareReplay(1),
  );

  /** Filtered list of items */
  public readonly itemsCatagorizedFiltered$ = combineLatest([
    this.itemsStore$,
    this.cartItems$,
    this.filterService.filterTerm$,
  ]).pipe(
    debounceTime(50),
    map( ([store,cart,term]) => Array.isArray(store) ? store.reduce( (acc,cur) => {
      // Filter out items with non-matching names or that are in the cart
      if ( (!term || !!cur.name.toLowerCase().includes(term.toLowerCase())) && cart.every( i => i.id !== cur.id ) ) {
        // add new property to ouput object of item category as an array
        if ( !acc.hasOwnProperty(cur.category) ) acc[cur.category] = [];
        // add the item to the array of the matching category property
        acc[cur.category].push(cur);
      }
      return acc;
    }, {} as { [key: string]: Item[] } ) : undefined ),
    shareReplay(1),
  );

  /** Filter list of cart items */
  public readonly cartItemsFiltered$ = combineLatest([
    this.cartItems$,
    this.filterService.filterTerm$,
  ]).pipe(
    debounceTime(50),
    // Keep item if matches filter
    map( ([cart,term]) => Array.isArray(cart) 
      ? cart.filter( item => (!term || !!item.name.toLowerCase().includes(term.toLowerCase())) ) 
      : undefined 
    ),
    shareReplay(1),
  );


  /** List of item categories retrieved from the list of items */
  public readonly categories$ = this.itemsCatagorizedFiltered$.pipe(
    map( items => !!items ? Object.keys(items) : undefined ),
    shareReplay(1),
  );

  constructor(
    private readonly filterService: FilterService,
    private readonly snackbar: MatSnackBar,
    private readonly listService: ListService,
    private readonly itemService: ItemService,
  ) { }

  ngOnInit(): void {
    // Indicates to the header that a list is filterable
    this.itemsStore$.subscribe( items => {
      this.filterService.filterable = (Array.isArray(items) && !!items.length);
    } );
  }

  ngOnDestroy() {
    this.filterService.filterable = false;
  }

  /** Moves item out of main list for later edit to toggle it's obtained state */
  public moveToCart( toAdd: Item ) {
    const itemCart = this.cartItems$.getValue();
    itemCart.push(toAdd);
    this.cartItems$.next( itemCart );
  }

  /** Begins the checkout process for bulk editing the cart items */
  public checkout() {
    this.itemService.batchEdit( this.cartItems$.getValue(), { obtained: true } as Item ).subscribe( res => {
      // Error occured and user opted to retry
      if ( !!res ) this.checkout();
      // Operation completed successfully
      else this.cartItems$.next([]);
    } );
  }
  
  /** Removes item from shopping cart */
  public removeFromCart( toRemove: Item ) {
    const itemCart = this.cartItems$.getValue();
    this.cartItems$.next( itemCart.filter( item => item.id !== toRemove.id ) );
  }

}
