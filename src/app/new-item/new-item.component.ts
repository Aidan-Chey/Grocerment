import { Component, Input, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { MatIconRegistry } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer } from '@angular/platform-browser';
import { EMPTY, of } from 'rxjs';
import { catchError, switchMap, take } from 'rxjs/operators';
import { EditItemComponent, editItemConfig } from '../edit-item/edit-item.component';
import { Item } from '../models/item.model';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-new-item',
  templateUrl: './new-item.component.html',
  styleUrls: ['./new-item.component.scss']
})
export class NewItemComponent implements OnInit {

  @Input() obtained = false;

  constructor( 
    private readonly firestore: AngularFirestore,
    private readonly authService: AuthService,
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

    this.authService.user$.pipe(
      take(1),
      switchMap( user => !!user.uid ? this.firestore.collection<Item>('items').add({
        user: user.uid,
        ...item
      }) : of(undefined) ),
      catchError( err => {
        // Failed to creeate item
        const errorSnackbarRef = this.snackbar.open( 'Failed to create item', 'Retry', { duration: 3000, verticalPosition: 'top' } );
        errorSnackbarRef.onAction().subscribe(() => {
          this.openDialog(item);
        });
        return EMPTY;
      } )
    ).subscribe( res => {
      // Item created successfully
      this.snackbar.open( 'Item created', undefined, { duration: 1000, verticalPosition: 'top' } );
    } );

  }

}
