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
    private readonly firestore: AngularFirestore,
    private readonly snackbar: MatSnackBar,
    private readonly listService: ListService,
  ) {
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
    const {id, ...toSave} = item;
    
    this.listService.listsCollectionRef$.pipe(
      take(1),
      switchMap( ref => !!ref ? ref.doc(this.listService.activeList?.id)
        .collection<Item>('items')
        .doc(id)
        .set(toSave) 
      : EMPTY ),
      tap( () => { 
        // Item editied successfully
        this.snackbar.open( 'Item edited', undefined, { duration: 1000, verticalPosition: 'top' } ); 
      } ),
      catchError( err => {
        // Failed to edit item
        const issue = 'Failed to edit item';
        if ( environment.production ) Sentry.captureException(err);
        else console.error(issue + ' |', err);
        const errorSnackbarRef = this.snackbar.open( issue, 'Retry', { duration: 3000, verticalPosition: 'top', panelClass: 'error' } );
        return errorSnackbarRef.onAction().pipe( 
          tap( () => { this.openEditDialog(item); } ),
        );
      } )
    ).subscribe(); 
  }

  }

  }

}
