import { Component, OnDestroy, OnInit } from '@angular/core';
import { combineLatest, from } from 'rxjs';
import { auditTime, catchError, debounceTime, filter, map, shareReplay, switchMap, toArray } from 'rxjs/operators';
import { FilterService } from '../services/filter.service';
import { Item } from '../models/item.model';
import { of } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EMPTY } from 'rxjs';
import { environment } from 'src/environments/environment';
import * as Sentry from "@sentry/angular";
import { ListService } from '../services/list.service';

@Component({
  selector: 'app-list-have',
  templateUrl: './list-have.component.html',
  styleUrls: ['./list-have.component.scss']
})
export class ListHaveComponent implements OnInit, OnDestroy {
  /** list of items from the store */
  private readonly itemsStore$ = this.listService.listsCollectionRef$.pipe( // Get logged in user UID
    auditTime(50),
    // Use UID to get their items
    switchMap( ref => ref
      .doc(this.listService.activeList?.id)
      .collection<Item>('items',ref => ref.where( 'obtained', '==', true ) )
      .valueChanges({idField: 'id'}) 
    ),
    catchError( err => {
      const issue = 'Failed to retrieve items';
      if ( environment.production ) Sentry.captureException(err);
      else console.error(issue + ' |', err);
      this.snackbar.open( issue, 'Dismiss', { duration: 3000, verticalPosition: 'bottom' } );
      return EMPTY;
    } ),
    shareReplay(1),
  );
  /** Filtered list of items */
  public readonly itemsFiltered$ = combineLatest([
    this.itemsStore$,
    this.filterService.filterTerm$,
  ]).pipe(
    debounceTime(50),
    switchMap( ([store,term]) => Array.isArray(store) ? from(store).pipe(
      // Filter out items with non-matching names
      filter( item => !!item.name.toLowerCase().includes(term.toLowerCase()) ),
      toArray(),
    ) : of([]) ),
    map( items => items.sort(this.compareFn) ),
    shareReplay(1),
  );

  constructor(
    private readonly filterService: FilterService,
    private readonly snackbar: MatSnackBar,
    private readonly listService: ListService,
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
