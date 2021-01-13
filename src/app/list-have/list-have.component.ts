import { Component, OnDestroy, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { combineLatest } from 'rxjs';
import { auditTime, debounceTime, filter, map, shareReplay, switchMap } from 'rxjs/operators';
import { FilterService } from '../services/filter.service';
import { Item } from '../models/item.model';
import { AuthService } from '../services/auth.service';
import { of } from 'rxjs';

@Component({
  selector: 'app-list-have',
  templateUrl: './list-have.component.html',
  styleUrls: ['./list-have.component.scss']
})
export class ListHaveComponent implements OnInit, OnDestroy {
  /** list of items from the store */
  private readonly itemsStore$ = this.authService.user$.pipe( // Get logged in user UID
    auditTime(50),
    // Use UID to get their items
    switchMap( user => !!user.uid ? this.firestore
      .collection<Item>('items', ref => ref.where('user','==',user.uid))
      .valueChanges({idField: 'id'}) : of(undefined)
    ),
    // Filter out items that have been obtained
    map( items => Array.isArray(items) ? items.filter( item => !!item.obtained ) : undefined ),
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
    private readonly authService: AuthService,
    private readonly firestore: AngularFirestore,
    private readonly filterService: FilterService,
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
