import { Component, Inject, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { FormBuilder } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, combineLatest } from 'rxjs';
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
    amount: null,
    estimated: false,
    quantity: 1,
    obtained: false,
  });
  /** List of items already created for reference */
  private readonly itemsStore$ = this.firestore.collection<Item>('items').valueChanges({idField: 'id'});
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
    shareReplay(1),
  );

  constructor(
    private readonly firestore: AngularFirestore,
    private readonly fb: FormBuilder,
    private readonly snackbar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: Item,
  ) { }

  ngOnInit(): void {
    this.itemGroup.patchValue( this.data );
  }
  /** Function that filters list of options based on input field value */
  private filterOptions(value: string, options: string[]) {
    const filterValue = value.toLowerCase();

    return Array.isArray(options) ? options.filter( option => !!option && option.toLowerCase().includes(filterValue) ) : undefined;
  }
  /** handles submission of item group form */
  public onSubmit() {
    this.itemGroup.markAllAsTouched();

    if ( !this.itemGroup.valid ) {
      console.error('Could not submit item as it\'s invalid');
      return;
    }

    this.createItem(this.itemGroup.getRawValue());

  }
  /** Attempts to create input item in DB */
  private createItem(item: Item) {

    this.firestore.collection<Item>('items').add(item).then( res => {
      // Item created successfully
      this.itemGroup.reset();
      this.snackbar.open( 'Item created', undefined, { duration: 1000, verticalPosition: 'top' } );
    }).catch( err => {
      // Failed to creeate item
      this.snackbar.open( 'Failed to create item', 'Retry', { duration: 3000, verticalPosition: 'top' } ).onAction().subscribe(() => {
        this.createItem(item);
      });
    });

  }

}
