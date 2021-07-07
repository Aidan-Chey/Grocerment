import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Item } from '@grocerment-models/item.model';
import { ListService } from '@grocerment-services/list.service';
import { BehaviorSubject, combineLatest, EMPTY, from, Observable, of, Subject } from 'rxjs';
import { debounceTime, filter, first, map, shareReplay, switchMap, takeUntil, tap, toArray } from 'rxjs/operators';
import { FilterService } from '@grocerment-services/filter.service';
import notEmpty from '@grocerment-globals/not-empty-filter';
import { AngularFireAuth } from '@angular/fire/auth';
import { EditItemComponent, editItemConfig } from '@grocerment-app/edit-item/edit-item.component';
import { ItemService } from '@grocerment-services/item.service';
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

  /** Items the user has */
  public readonly itemsHave$ = combineLatest([
    this.listService.items$,
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
    this.listService.items$,
  ]).pipe(
    switchMap( ([references,items]) => {
      if ( !Array.isArray(references) || !references.length || !Array.isArray(items) || !items.length ) return of([] as Item[]);
      return from(references).pipe(
        map( ref => {
          const foundItem = items.find( item => item.id === ref );
          if ( !foundItem || !!foundItem.obtained ) this.removeCartItem(ref);
          return foundItem;
        } ),
        filter( notEmpty ),
        toArray(),
      ) as Observable<Item[]>;
    }),
    shareReplay(1),
  );
  
  /** Items the user needs */
  public readonly itemsNeed$: Observable<{ name: string, items: Item[] }[]> = combineLatest([
    this.listService.items$,
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
          const categoryPosition = categoriesMap.get(item.category?.toLowerCase());
          if ( typeof categoryPosition === 'undefined' ) 
            categoriesMap.set( item.category?.toLowerCase(), output.push({
              name: item.category,
              items: [item],
            }) );
          else output[categoryPosition-1].items.push(item);
        } ),
        toArray(),
        map( () => output.sort(this.categoryCompareFn) ),
      );
    }),
    shareReplay(1),
  );

  /** ID fo the item being edited */
  public readonly editItemRef$ = new BehaviorSubject<number|null>(null);
  /** Observable of the item being edited */
  public readonly edititem$ = combineLatest([
    this.listService.items$,
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
    this.listService.items$.pipe(
      takeUntil(this.componentDestruction$),
    ).subscribe( items => {
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

  /** Function */
  private categoryCompareFn( a: { name: string, items: Item[] }, b: { name: string, items: Item[] } ) {
    const aName = a.name?.toLowerCase();
    const bName = b.name?.toLowerCase();
    if (aName < bName)
      return -1;
    if (aName > bName)
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
      refs.splice( index, 1 );
      this.cartItemRefs$.next( refs );
    } );
  }

  public moveToCart( toMove: string ): void {
    if ( !toMove ) return;
    this.cartItemRefs$.pipe(
      first(),
    ).subscribe( refs => {
      if ( !Array.isArray(refs) ) {
        this.cartItemRefs$.next( [ toMove ] );
      } else {
        refs.push( toMove );
        this.cartItemRefs$.next( refs );
      }
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
