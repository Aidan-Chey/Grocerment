import { Component, Input, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { MatIconRegistry } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer } from '@angular/platform-browser';
import { EditItemComponent, editItemConfig } from '../edit-item/edit-item.component';
import { Item } from '../item.model';

@Component({
  selector: 'app-new-item',
  templateUrl: './new-item.component.html',
  styleUrls: ['./new-item.component.scss']
})
export class NewItemComponent implements OnInit {

  @Input() obtained = false;

  constructor( 
    private readonly firestore: AngularFirestore,
    private readonly snackbar: MatSnackBar,
    private readonly matDialog: MatDialog,
    private readonly iconRegistry: MatIconRegistry,
    private readonly sanitizer: DomSanitizer,
   ) {
    this.iconRegistry.addSvgIcon( 'new', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/plus.svg') );
  }

  ngOnInit(): void {
  }

  public openDialog( item = { obtained: this.obtained } ) {
    const dialogConfig = Object.assign({ data: item }, editItemConfig);
    this.matDialog.open(EditItemComponent, dialogConfig).afterClosed().subscribe( (item: Item) => {
      if ( !!item ) this.createItem(item);
    });

  }

  /** Attempts to create input item in DB */
  private createItem(item: Item) {

    this.firestore.collection<Item>('items').add(item).then( res => {
      // Item created successfully
      this.snackbar.open( 'Item created', undefined, { duration: 1000, verticalPosition: 'top' } );
    }).catch( err => {
      // Failed to creeate item
      this.snackbar.open( 'Failed to create item', 'Retry', { duration: 3000, verticalPosition: 'top' } ).onAction().subscribe(() => {
        this.openDialog(item);
      });
    });

  }

}
