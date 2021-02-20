import { Component, OnDestroy, OnInit } from '@angular/core';
import { combineLatest } from 'rxjs';
import { auditTime, catchError, debounceTime, map, shareReplay, switchMap } from 'rxjs/operators';
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
    switchMap( (ref) => {
      if ( !ref ) return of(undefined);
      // const listCondition = (!!activeList ? ['list.users','array-contains',activeList.id] : ['user','==',user.uid]) as [string, 'array-contains'|'==', string|number];
      return ref
        .doc(this.listService.activeList?.id)
        .collection<Item>('items',ref => ref.where( 'obtained', '==', true ) )
        .valueChanges({idField: 'id'}) 
    } ),
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
  public readonly itemsCatagorizedFiltered$ = combineLatest([
    this.itemsStore$,
    this.filterService.filterTerm$,
  ]).pipe(
    debounceTime(50),
    map( ([store,term]) => Array.isArray(store) ? store.reduce( (acc,cur) => {
      // Filter out items with non-matching names
      if ( !!cur.name.toLowerCase().includes(term.toLowerCase()) ) {
        // add new property to ouput object of item category as an array
        if ( !acc.hasOwnProperty(cur.category) ) acc[cur.category] = [];
        // add the item to the array of the matching category property
        acc[cur.category].push(cur);
      }
      return acc;
    }, {} as { [key: string]: Item[] } ) : undefined ),
    shareReplay(1),
  );

  public readonly categories$ = this.itemsCatagorizedFiltered$.pipe(
    map( items => !!items ? Object.keys(items) : undefined ),
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

}
