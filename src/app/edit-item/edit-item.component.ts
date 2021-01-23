import { Component, Inject, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { of, combineLatest } from 'rxjs';
import { map, shareReplay, startWith, take, tap } from 'rxjs/operators';
import { Item } from '../models/item.model';
import { Measurement } from '../models/measurement.model';

export const editItemConfig = {
	minWidth: '5em',
	width: '95vw',
	maxWidth: '50em',
};

@Component({
  selector: 'app-edit-item',
  templateUrl: './edit-item.component.html',
  styleUrls: ['./edit-item.component.scss']
})
export class EditItemComponent implements OnInit {
  /** Controls for an item to edit */
  public readonly itemGroup = this.fb.group({
    name: '',
    category: '',
    measurement: null,
    amount: null,
    estimated: false,
    quantity: 1,
    obtained: false,
  } as Item);
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
    private readonly iconRegistry: MatIconRegistry,
    private readonly sanitizer: DomSanitizer,
    private readonly firestore: AngularFirestore,
    private afAuth: AngularFireAuth,
    private readonly fb: FormBuilder,
    public readonly dialogRef: MatDialogRef<EditItemComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Item,
  ) {
    this.iconRegistry.addSvgIcon( 'cancel', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/plus.svg') );
  }

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
      console.error('Could not save item as it\'s invalid');
      return;
    }

    const formData = this.itemGroup.getRawValue();

    this.afAuth.user.pipe(
      take(1),
    ).subscribe( user => {
      if ( !!formData.measurement ) formData.measurement = this.firestore.collection<Measurement>("measurement").doc(formData.measurement).ref;

      const item = { id: this.data?.id, ...formData, user: user?.uid };
  
      this.dialogRef.close(item);

    } );

  }

}
