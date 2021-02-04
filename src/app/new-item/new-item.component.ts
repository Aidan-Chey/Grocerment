import { Component, Input, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { combineLatest, EMPTY, of } from 'rxjs';
import { catchError, switchMap, take } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { EditItemComponent, editItemConfig } from '../edit-item/edit-item.component';
import { Item } from '../models/item.model';
import * as Sentry from '@sentry/angular';
import { ListService } from '../services/list.service';
import { List } from '../models/list.model';

@Component({
  selector: 'app-new-item',
  templateUrl: './new-item.component.html',
  styleUrls: ['./new-item.component.scss']
})
export class NewItemComponent implements OnInit {

  @Input() obtained = false;

  constructor( 
    private readonly firestore: AngularFirestore,
    private readonly afAuth: AngularFireAuth,
    private readonly snackbar: MatSnackBar,
    private readonly matDialog: MatDialog,
    private readonly listService: ListService,
   ) {
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
    const { id, ...toSave } = item;

    this.afAuth.user.pipe(
      take(1),
      switchMap( user => !!user && !!this.listService.activeList ? this.firestore.collection<List>('lists').doc(this.listService.activeList.id).collection<Item>('items').add(toSave) : of(undefined) ),
      catchError( err => {
        const issue = 'Failed to create item';
        if ( environment.production ) Sentry.captureException(err);
        else console.error(issue + ' |', err);
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
