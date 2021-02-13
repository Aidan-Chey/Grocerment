import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SwUpdate } from '@angular/service-worker';
import { BehaviorSubject } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { ConfirmData, ConfirmDialog } from '../confirm/confirm.dialog';

@Injectable({
  providedIn: 'root'
})
export class ServiceWorkerService {

  private _updateAvaliable =  new BehaviorSubject<boolean>(false);
  public readonly updateAvaliable$ = this._updateAvaliable.asObservable();

  constructor(
    public readonly updates: SwUpdate,
    public readonly dialog: MatDialog,
  ) {
 
    // Watch for avaiable service worker updates
    updates.available.subscribe(event => {
      updates.activateUpdate().then(() => this._updateAvaliable.next(true));
    });

    // Display a popup dialog when ever an update is avaliable
    this.updateAvaliable$.pipe(
      switchMap( () => {
        const data = {
          title: 'App Update Avaliable!',
          content: 'New version of Grocerment is avaliable. The app needs to reload inorder to update and you will loose unsaved changes.',
          accept: 'Update',
          decline: 'Later',
        } as ConfirmData;
        return this.dialog.open( ConfirmDialog, { data } ).afterClosed();
      } ),
      filter( res => !!res ),
    ).subscribe( () => {
      this.reloadApp();
    } );
  
  }

  reloadApp(){
    document.location.reload();
  }

}
