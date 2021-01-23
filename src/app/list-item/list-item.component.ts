import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { MatIconRegistry } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer } from '@angular/platform-browser';
import { EditItemComponent, editItemConfig } from '../edit-item/edit-item.component';
import { Item } from '../models/item.model';

@Component({
  selector: 'app-list-item',
  templateUrl: './list-item.component.html',
  styleUrls: ['./list-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListItemComponent implements OnInit {

  @Input() item = {} as Item;

  constructor(
    private readonly iconRegistry: MatIconRegistry,
    private readonly sanitizer: DomSanitizer,
    private readonly matDialog: MatDialog,
    private readonly firestore: AngularFirestore,
    private readonly snackbar: MatSnackBar,
  ) {
    this.iconRegistry.addSvgIcon( 'edit', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/pencil.svg') );
  }

  ngOnInit(): void {
  }

  /** Open item editing dialog */
  openEditDialog( item: Item ) {
    const dialogConfig = Object.assign({ data: item }, editItemConfig);

    this.matDialog.open( EditItemComponent, dialogConfig).afterClosed().subscribe( (res: Item) => {
      if ( !!res ) this.editItem( res );
    } );
  }
  /** Save edited item to DB */
  editItem( item: Item ) {
    const {id, ...toSave} = item,
      itemRef = this.firestore.collection<Item>('items').doc(id);

    itemRef.set(toSave).then( res => {
      // Item editied successfully
      this.snackbar.open( 'Item edited', undefined, { duration: 1000, verticalPosition: 'top' } );
    }).catch( err => {
      // Failed to edit item
      const errorSnackbarRef = this.snackbar.open( 'Failed to edit item', 'Retry', { duration: 3000, verticalPosition: 'top', panelClass: 'error' } );
      errorSnackbarRef.onAction().subscribe(() => {
        this.openEditDialog(item);
      });
    });
  }

}
