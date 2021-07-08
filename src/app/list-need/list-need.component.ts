import { AfterViewInit, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EditItemComponent, editItemConfig } from '@grocerment-app/edit-item/edit-item.component';
import { ItemService } from '@grocerment-services/item.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { distinctUntilChanged, takeUntil, tap } from 'rxjs/operators';
import { Item } from '@grocerment-models/item.model';
import { FilterService } from '@grocerment-app/services/filter.service';
import { MatAccordion } from '@angular/material/expansion';

@Component({
  selector: 'app-list-need',
  templateUrl: './list-need.component.html',
  styleUrls: ['./list-need.component.scss']
})
export class ListNeedComponent implements OnChanges, AfterViewInit {

  @ViewChild(MatAccordion) accordion: MatAccordion | null = null;

  @Input('items') inputItems: { name: string, items: Item[] }[] | null = null;
  /** Moves item out of main list for later edit to toggle it's obtained state */
  @Output() moveToCart = new EventEmitter<string>();

  private readonly componentDestruction$ = new Subject();
  public readonly itemsCatagorized$ = new BehaviorSubject<{ name: string, items: Item[] }[] | null>(null);

  constructor(
    private readonly itemService: ItemService,
    public readonly filterService: FilterService,
    private readonly dialog: MatDialog,
    private readonly snackbar: MatSnackBar,
  ) {
  }

  ngOnChanges( changes: SimpleChanges ) {
    if ( changes.hasOwnProperty('inputItems') ) {
      this.itemsCatagorized$.next(changes.inputItems.currentValue);
    }
  }

  ngAfterViewInit() {
    // Follows the filter state, opening and closing categories if being filtered
    this.filterService.filterTerm$.pipe(
      takeUntil(this.componentDestruction$),
      distinctUntilChanged(),
    ).subscribe( term => {
      // Check for filtering term
      if ( !!term )  {
        // Open all categories
        setTimeout( () => {
          if ( !this.accordion ) return;
          this.accordion.multi = true;
          this.accordion.openAll();
        } );
      } else {
        setTimeout( () => {
          if ( !this.accordion ) return;
          this.accordion.closeAll();
          this.accordion.multi = false;
        } );
      }
    } );
  }

  ngOnDestroy() {
    this.componentDestruction$.next();
  }

  /** Open item editing dialog */
  openEditDialog( item: Item ) {

    const dialogConfig = Object.assign({ data: item }, editItemConfig);

    this.dialog.open( EditItemComponent, dialogConfig)
      .afterClosed()
      .subscribe( (res: Item) => {
        if ( !!res ) this.editItem( res );
      } );

  }

  /** Save edited item to DB */
  editItem( item: Item ) {
    
    this.itemService.editItem( item ).pipe(
      tap( res => { if (!!res) this.openEditDialog(item) } ),
    ).subscribe( () => {
      this.snackbar.open( 'Item edited', undefined, { duration: 1000, verticalPosition: 'bottom' } ); 
    }); 

  }

  /** Moves the item between have & need states */
  toggleObtained( item: Item ) {

    const toSave = { id: item.id, obtained: !item.obtained } as Item;

    this.itemService.editItem( toSave ).pipe(
      tap( res => { if (!!res) this.toggleObtained(item) } ),
    ).subscribe();

  }

  /** deletes the item from DB */
  deleteItem( item: Item ) {

    this.itemService.deleteItem( item ).subscribe();

  }

  /** Tracks items by their ID */
  public trackByItemID(index:number, el:any): string {
    return el.id;
  }

  public trackByName(index:number, el:any): string {
    return el.name;
  }

}
