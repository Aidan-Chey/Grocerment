import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { EditItemComponent, editItemConfig } from '@grocerment-app/edit-item/edit-item.component';
import { ItemService } from '@grocerment-app/services/item.service';
import { tap } from 'rxjs/operators';
import { Item } from '../models/item.model';

@Component({
  selector: 'app-list-have',
  templateUrl: './list-have.component.html',
  styleUrls: ['./list-have.component.scss']
})
export class ListHaveComponent {

  @Input('items') inputItems: Item[] | null = null;

  constructor(
    private readonly matDialog: MatDialog,
    private readonly itemService: ItemService,
  ) { }

  /** Tracks items by their ID */
  public trackByItemID(index:number, el:any): number {
    return el.id;
  }

  /** Open item editing dialog */
  openEditDialog( item: Item ) {

    const dialogConfig = Object.assign({ data: item }, editItemConfig);

    this.matDialog.open( EditItemComponent, dialogConfig)
      .afterClosed()
      .subscribe( (res: Item) => {
        if ( !!res ) this.editItem( res );
      } );

  }

  /** Save edited item to DB */
  editItem( item: Item ) {
    
    this.itemService.editItem( item ).pipe(
      tap( res => { if (!!res) this.openEditDialog(item) } ),
    ).subscribe(); 

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

    this.itemService.deleteitem( item ).subscribe();

  }

}
