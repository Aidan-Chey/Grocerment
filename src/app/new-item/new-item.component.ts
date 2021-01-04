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

  private readonly itemsStore$ = this.firestore.collection<Item>('items').valueChanges();

  public readonly measurements$ = this.firestore.collection<Measurement>('measurements').valueChanges({idField: 'id'});

  public readonly nameOptions$ = this.itemsStore$.pipe(
    map( items => Array.isArray(items) ? items.reduce( (acc,cur) => {
      if ( !acc.includes(cur.name) ) acc.push(cur.name);
      return acc;
    }, [] as string[] ) : undefined ),
    shareReplay(1),
  );

  public readonly filteredNameOptions$ = combineLatest([
    (this.itemGroup.get('name')?.valueChanges || of('')).pipe( startWith('') ),
    this.nameOptions$,
  ]).pipe(
    map( ([value,options]) => this.filterOptions( (value || ''), options || [] ) ),
    tap( data => console.dir(data) ),
    shareReplay(1),
  );

  public readonly categoryOptions$ = this.itemsStore$.pipe(
    map( items => Array.isArray(items) ? items.reduce( (acc,cur) => {
      if ( !acc.includes(cur.category) ) acc.push(cur.category);
      return acc;
    }, [] as string[] ) : undefined ),
    shareReplay(1),
  );

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

  private filterOptions(value: string, options: string[]) {
    const filterValue = value.toLowerCase();

    return Array.isArray(options) ? options.filter( option => option.toLowerCase().includes(filterValue) ) : undefined;
  }

}
