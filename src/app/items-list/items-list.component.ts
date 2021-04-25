import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Item } from '@grocerment-app/models/item.model';
import { ListService } from '@grocerment-app/services/list.service';
import { BehaviorSubject, combineLatest, EMPTY, from, Observable, of, Subject } from 'rxjs';
import { auditTime, catchError, debounceTime, filter, first, map, shareReplay, switchMap, takeUntil, tap, toArray } from 'rxjs/operators';
import * as Sentry from "@sentry/angular";
import { environment } from 'src/environments/environment';
import { FilterService } from '@grocerment-app/services/filter.service';
import notEmpty from '@grocerment-app/globals/not-empty-filter';
import { AngularFireAuth } from '@angular/fire/auth';
import { EditItemComponent, editItemConfig } from '@grocerment-app/edit-item/edit-item.component';
import { ItemService } from '@grocerment-app/services/item.service';
import { MatDialog } from '@angular/material/dialog';

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
    switchMap( ([store,term]) => {
      if ( !Array.isArray(store) || !store.length ) return of([] as Item[]); 
      return from(store).pipe(
        // Filter out items with non-matching names & are obtained
        filter( item => !!item.name.toLowerCase().includes(term.toLowerCase()) && !!item.obtained ),
        toArray(),
      );
    } ),
    shareReplay(1),
  );

  /** Subject to assist in the maniputlation of the list of items in the cart */
  private readonly cartItemRefs$ = new BehaviorSubject<string[]>([]);
  /** Observable of the list of items in the cart */
  public readonly cartItems$ = combineLatest([
    this.cartItemRefs$,
    this.itemsStore$,
  ]).pipe(
    switchMap( ([references,items]) => {
      if ( !Array.isArray(references) || !references.length || !Array.isArray(items) || !items.length ) return of([] as Item[]);
      return from(references).pipe(
        map( ref => items.find( item => item.id === ref ) ),
        filter( notEmpty ),
        toArray(),
      ) as Observable<Item[]>;
    }),
    shareReplay(1),
  );
  
  /** Items the user needs */
  public readonly itemsNeed$: Observable<{ name: string, items: Item[] }[]> = combineLatest([
    this.itemsStore$,
    this.cartItems$,
    this.filterService.filterTerm$,
  ]).pipe(
    debounceTime(50),
    switchMap( ([store,cart,term]) => {
      const output = [] as { name: string, items: Item[] }[];
      if ( !Array.isArray(store) || !store.length ) return of(output);
      const categoriesMap = new Map<string, number>();
      return from(store).pipe(
        // Filter out items with non-matching names or that are in the cart
        filter( item => (!term || !!item.name.toLowerCase().includes(term.toLowerCase())) 
          && cart.every( i => i.id !== item.id ) 
          && !item.obtained 
        ),
        tap( item => {
          const categoryPosition = categoriesMap.get(item.category);
          if ( typeof categoryPosition === 'undefined' ) 
            categoriesMap.set( item.category, output.push({
              name: item.category,
              items: [item],
            }) );
          else output[categoryPosition-1].items.push(item);
        } ),
        toArray(),
        map( () => output ),
      );
    }),
    shareReplay(1),
  );

  /** ID fo the item being edited */
  public readonly editItemRef$ = new BehaviorSubject<number|null>(null);
  /** Observable of the item being edited */
  public readonly edititem$ = combineLatest([
    this.itemsStore$,
    this.editItemRef$,
  ]).pipe(
    map( ([items,edit]) => {
      if ( !edit ) return null;
      const foundItem = items.find( item => item.id === edit.toString() ) || null;
      return foundItem;
    } ),
    shareReplay(1),
  );

  constructor(
    private readonly listService: ListService,
    private readonly snackbar: MatSnackBar,
    public readonly filterService: FilterService,
    private readonly afAuth: AngularFireAuth,
    private readonly itemService: ItemService,
    private readonly dialog: MatDialog,
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

  /** Attempts to remove an item's reference from the cart list */
  public removeCartItem( toRemove: string ): void {
    if ( !toRemove ) return;
    this.cartItemRefs$.pipe(
      first(),
    ).subscribe( refs => {
      if ( !Array.isArray(refs) ) return;
      const index = refs.findIndex( ref => ref === toRemove );
      this.cartItemRefs$.next( refs.splice( index, 1 ) );
    } );
  }

  /** Empties the cart of all items */
  public clearCart(): void {
    this.cartItemRefs$.next([]);
  }

  public openCreateItemDialog() {
    const data = {} as Item;

    if ( !!this.filterService.filterTerm ) data.name = this.filterService.filterTerm;

    const dialogConfig = {
      ...editItemConfig,
      height: 'auto',
      data,
    };
    this.dialog.open(EditItemComponent, dialogConfig).afterClosed().pipe(
      switchMap( item => !!item ? this.itemService.createItem( item ) : EMPTY ),
    ).subscribe();
  }

}
