import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EMPTY } from 'rxjs';
import { catchError, map, switchMap, take, tap } from 'rxjs/operators';
import { EditItemComponent, editItemConfig } from '../edit-item/edit-item.component';
import { Item } from '../models/item.model';
import * as Sentry from '@sentry/angular';
import { ListService } from '../services/list.service';
import { environment } from 'src/environments/environment';
import { ItemService } from '../services/item.service';

@Component({
  selector: 'app-list-item',
  templateUrl: './list-item.component.html',
  styleUrls: ['./list-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListItemComponent implements OnInit {

  @Input() item = {} as Item;

  constructor(
    private readonly matDialog: MatDialog,
    private readonly snackbar: MatSnackBar,
    private readonly listService: ListService,
    private readonly itemService: ItemService,
  ) {
  }

  ngOnInit(): void {
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
