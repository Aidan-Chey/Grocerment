import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { combineLatest } from 'rxjs';
import { map, shareReplay, startWith, tap } from 'rxjs/operators';
import { Item } from '../item.model';
import { Measurement } from '../measurement.model';

@Component({
  selector: 'app-new-item',
  templateUrl: './new-item.component.html',
  styleUrls: ['./new-item.component.scss']
})
export class NewItemComponent implements OnInit {

  public readonly itemGroup = this.fb.group({
    name: null,
    category: null,
    measurement: null,
    quantity: null,
    count: 1,
    need: true,
  });
  /** List of items already created for reference */
  private readonly itemsStore$ = this.firestore.collection<Item>('items').valueChanges();
  /** List of measurements for reference */
  public readonly measurements$ = this.firestore.collection<Measurement>('measurements').valueChanges({idField: 'id'}).pipe(
    // Adds extra entry to list of measurements for clearing selection
    map( measurements => {
      measurements.unshift( { id: '', name: 'None', unit: '' } );
      return measurements;
    }),
    shareReplay(1),
  );
  /** List of names of existing items */
  public readonly nameOptions$ = this.itemsStore$.pipe(
    map( items => Array.isArray(items) ? items.reduce( (acc,cur) => {
      if ( !acc.includes(cur.name) ) acc.push(cur.name);
      return acc;
    }, [] as string[] ) : undefined ),
    shareReplay(1),
  );
  /** filtered lit of names based on existing value of name field */
  public readonly filteredNameOptions$ = combineLatest([
    (this.itemGroup.get('name')?.valueChanges || of('')).pipe( startWith('') ),
    this.nameOptions$,
  ]).pipe(
    map( ([value,options]) => this.filterOptions( (value || ''), options || [] ) ),
    tap( data => console.dir(data) ),
    shareReplay(1),
  );
  /** List of categories of existing items */
  public readonly categoryOptions$ = this.itemsStore$.pipe(
    map( items => Array.isArray(items) ? items.reduce( (acc,cur) => {
      if ( !acc.includes(cur.category) ) acc.push(cur.category);
      return acc;
    }, [] as string[] ) : undefined ),
    shareReplay(1),
  );
  /** filtered list of categories based on existing value of category field */
  public readonly filteredCategoryOptions$ = combineLatest([
    (this.itemGroup.get('category')?.valueChanges || of('')).pipe( startWith('') ),
    this.categoryOptions$,
  ]).pipe(
    map( ([value,options]) => this.filterOptions( (value || ''), options || [] ) ),
    tap( data => console.dir(data) ),
    shareReplay(1),
  );

  constructor(
    private readonly firestore: AngularFirestore,
    private readonly fb: FormBuilder,
  ) { }

  ngOnInit(): void {
  }
  /** Function that filters list of options based on input field value */
  private filterOptions(value: string, options: string[]) {
    const filterValue = value.toLowerCase();

    return Array.isArray(options) ? options.filter( option => option.toLowerCase().includes(filterValue) ) : undefined;
  }

}
