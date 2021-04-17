import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { BehaviorSubject, combineLatest, from, Subject, of } from 'rxjs';
import { debounceTime, map, shareReplay, switchMap, toArray } from 'rxjs/operators';
import { Item } from '../models/item.model';

@Component({
  selector: 'app-list-need',
  templateUrl: './list-need.component.html',
  styleUrls: ['./list-need.component.scss']
})
export class ListNeedComponent implements OnChanges {

  @Input('items') inputItems: Item[] = [];

  private readonly componentDestruction$ = new Subject();
  private readonly itemsStore$ = new BehaviorSubject<Item[]>([]);

  /** Filtered list of items */
  public readonly itemsCatagorized$ = combineLatest([
    this.itemsStore$
  ]).pipe(
    debounceTime(50),
    switchMap( ([store]) => {
      const output = {} as { [key: string]: Item[] };
      if ( !Array.isArray(store) ) return of(output);
      return from(store).pipe(
        map( item => {
          // add new property to ouput object of item category as an array
          if ( !output.hasOwnProperty(item.category) ) output[item.category] = [];
          // add the item to the array of the matching category property
          output[item.category].push(item);
        } ),
        toArray(),
        map( () => output ),
      );
    }),
    shareReplay(1),
  );

  /** List of item categories retrieved from the list of items */
  public readonly categories$ = this.itemsCatagorized$.pipe(
    map( items => !!items ? Object.keys(items).sort() : [] ),
    shareReplay(1),
  );

  constructor() {
  }

  ngOnChanges( changes: SimpleChanges ) {
    if ( changes.hasOwnProperty('inputItems') ) {
      this.itemsStore$.next(changes.inputItems.currentValue);
    }
  }

  ngOnDestroy() {
    this.componentDestruction$.next();
  }

  /** Moves item out of main list for later edit to toggle it's obtained state */
  public moveToCart( toAdd: Item ) {
  }

  /** Tracks items by their ID */
  public trackByItemID(index:number, el:any): number {
    return el.id;
  }

}
