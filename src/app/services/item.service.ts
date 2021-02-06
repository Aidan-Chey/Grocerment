import { Injectable } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { catchError, switchMap, take, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Item } from '../models/item.model';
import { ListService } from './list.service';
import * as Sentry from '@sentry/angular';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class ItemService {

  constructor(
    private readonly listService: ListService,
    private readonly snackbar: MatSnackBar,
  ) { }

  /** deletes the item from DB */
  public deleteitem( item: Item ): Observable<unknown> {

    return this.listService.listsCollectionRef$.pipe(
      take(1),
      switchMap( ref => !!ref ? ref.doc(this.listService.activeList?.id)
        .collection<Item>('items')
        .doc(item.id)
        .delete()
      : EMPTY ),
      catchError( err => {
        // Failed to edit item
        const issue = 'Failed to delete item';
        if ( environment.production ) Sentry.captureException(err);
        else console.error(issue + ' |', err);
        const errorSnackbarRef = this.snackbar.open( issue, 'Retry', { duration: 3000, verticalPosition: 'top', panelClass: 'error' } );
        return errorSnackbarRef.onAction().pipe( 
          tap( () => { this.deleteitem(item); } ),
        );
      } ),
      switchMap( () => {
        const errorSnackbarRef = this.snackbar.open( 'Item Deleted', 'Undo', { duration: 3000, verticalPosition: 'top', panelClass: 'error' } );
        return errorSnackbarRef.onAction().pipe( 
          switchMap( () => this.createItem(item) ),
        );
      } )
    );

  }

  public createItem( item: Item ): Observable<unknown> {

    const { id, ...toSave } = item;
    
    return this.listService.listsCollectionRef$.pipe(
      take(1),
      switchMap( ref => !!ref && !!this.listService.activeList ? ref.doc(this.listService.activeList.id)
        .collection<Item>('items')
        .add(toSave) 
      : EMPTY ),
      catchError( err => {
        const issue = 'Failed to create item';
        if ( environment.production ) Sentry.captureException(err);
        else console.error(issue + ' |', err);
        const errorSnackbarRef = this.snackbar.open( 'Failed to create item', 'Retry', { duration: 3000, verticalPosition: 'top' } );
        return errorSnackbarRef.onAction().pipe(
          switchMap( () => this.createItem(toSave) ),
        );
      } ),
      tap( () => {
        // Item created successfully
        this.snackbar.open( 'Item created', undefined, { duration: 1000, verticalPosition: 'top' } );
      } ),
    )

  }

  /**  */
  public editItem( item: Item ): Observable<boolean | void> {

    const { id, ...toSave } = item;
    
    return this.listService.listsCollectionRef$.pipe(
      take(1),
      switchMap( ref => !!ref ? ref.doc(this.listService.activeList?.id)
        .collection<Item>('items')
        .doc(id)
        .update(toSave) 
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
        return errorSnackbarRef.onAction()
      } ),
    );

  }

}
