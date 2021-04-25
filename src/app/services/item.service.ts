import { Injectable } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { catchError, map, switchMap, take, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Item } from '../models/item.model';
import { ListService } from './list.service';
import * as Sentry from '@sentry/angular';
import { MatSnackBar } from '@angular/material/snack-bar';
import firebase from 'firebase/app';


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
      switchMap( ref => ref.doc(this.listService.activeList?.id)
        .collection<Item>('items')
        .doc(item.id)
        .delete()
      ),
      catchError( err => {
        // Failed to edit item
        const issue = 'Failed to delete item';
        if ( environment.production ) Sentry.captureException(err);
        else console.error(issue + ' |', err);
        const errorSnackbarRef = this.snackbar.open( issue, 'Retry', { duration: 3000, verticalPosition: 'bottom', panelClass: 'error' } );
        return errorSnackbarRef.onAction().pipe( 
          tap( () => { this.deleteitem(item); } ),
        );
      } ),
      switchMap( () => {
        const errorSnackbarRef = this.snackbar.open( 'Item Deleted', 'Undo', { duration: 3000, verticalPosition: 'bottom', panelClass: 'error' } );
        return errorSnackbarRef.onAction().pipe( 
          switchMap( () => this.createItem(item) ),
        );
      } )
    );

  }

  /** Creates a new item */
  public createItem( item: Item ): Observable<unknown> {

    const { id, ...toSave } = item;
    
    return this.listService.listsCollectionRef$.pipe(
      take(1),
      switchMap( ref => !!this.listService.activeList ? ref.doc(this.listService.activeList.id)
        .collection<Item>('items')
        .add(toSave) 
      : EMPTY ),
      catchError( err => {
        const issue = 'Failed to create item';
        if ( environment.production ) Sentry.captureException(err);
        else console.error(issue + ' |', err);
        const errorSnackbarRef = this.snackbar.open( 'Failed to create item', 'Retry', { duration: 3000, verticalPosition: 'bottom' } );
        return errorSnackbarRef.onAction().pipe(
          switchMap( () => this.createItem(toSave) ),
        );
      } ),
      tap( () => {
        // Item created successfully
        this.snackbar.open( 'Item created', undefined, { duration: 1000, verticalPosition: 'bottom' } );
      } ),
    )

  }

  /** Updates an existing item */
  public editItem( item: Item ): Observable<boolean | void> {

    const { id, ...toSave } = item;
    
    return this.listService.listsCollectionRef$.pipe(
      take(1),
      switchMap( ref => ref.doc(this.listService.activeList?.id)
        .collection<Item>('items')
        .doc(id)
        .update(toSave) 
      ),
      catchError( err => {
        // Failed to edit item
        const issue = 'Failed to edit item';
        if ( environment.production ) Sentry.captureException(err);
        else console.error(issue + ' |', err);
        const errorSnackbarRef = this.snackbar.open( issue, 'Retry', { duration: 3000, verticalPosition: 'bottom', panelClass: 'error' } );
        return errorSnackbarRef.onAction()
      } ),
    );

  }

  /** Update many items at once */
  public batchEdit( items: Item[], update: Item ) {

    const { id, ...toSave } = update;
    const toUpdate = items.map( i => i.id );
    const batch = firebase.firestore().batch();
    
    return this.listService.listsCollectionRef$.pipe(
      take(1),
      switchMap( ref => {
        if ( !ref ) return EMPTY;

        const itemsRef = ref.doc(this.listService.activeList?.id)
        .collection<Item>('items');
        
        toUpdate.forEach( itemID => {
          batch.update( itemsRef.doc(itemID).ref, toSave );
        } );

        return batch.commit()
      } ),
      catchError( err => {
        // Failed to edit item
        const issue = 'Failed to edit items';
        if ( environment.production ) Sentry.captureException(err);
        else console.error(issue + ' |', err);
        const errorSnackbarRef = this.snackbar.open( issue, 'Retry', { duration: 3000, verticalPosition: 'bottom', panelClass: 'error' } );
        return errorSnackbarRef.onAction()
      } ),
      map( () => { 
        // Item editied successfully
        this.snackbar.open( 'Items edited', undefined, { duration: 1000, verticalPosition: 'bottom' } ); 
        return undefined;
      } ),
    );

  }

}
