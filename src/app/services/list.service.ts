import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AngularFirestore } from '@angular/fire/firestore';
import { BehaviorSubject, EMPTY, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { List } from '../models/list.model';
import * as Sentry from '@sentry/angular';
import { catchError, shareReplay, switchMap, take, takeUntil } from 'rxjs/operators';
import { AngularFireAuth } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class ListService {

  public readonly activeListSubject = new BehaviorSubject<List | undefined>(undefined);
  
  public readonly lists$ = this.firestore.collection<List>('lists').valueChanges({idField: 'id'}).pipe(
    shareReplay(1),
  );

  constructor(
    private readonly firestore: AngularFirestore,
    private readonly snackbar: MatSnackBar,
    private readonly afAuth: AngularFireAuth,
  ) {
    // Retrieve active list from storage if set
    try {
      const storedlist = localStorage.getItem('activeList');
      if ( !!storedlist && storedlist !== 'undefined' ) this.activeListSubject.next(JSON.parse(storedlist));
    } catch (err) {
      const issue = 'Failed to retrieving active list';
      if ( environment.production ) Sentry.captureException(err);
      else console.error(issue + ' |', err);
      this.snackbar.open( issue, 'Dismiss', { duration: 3000, verticalPosition: 'top' } );
    }
    if ( !this.activeListSubject.getValue() ) {
      this.lists$.pipe(
        takeUntil(this.activeListSubject.asObservable()),
      ).subscribe( lists => {
        // Select a new active list
        if ( !!Array.isArray(lists) && !!lists.length ) this.activeListSubject.next(lists[0]);
        // Create a new list
        else this.newList();
      } );
    }
    // Saves set active list for retrieval on init
    this.activeListSubject.asObservable().subscribe( activeList => {
      try {
        localStorage.setItem('activeList', JSON.stringify(activeList));
      } catch (err) {
        const issue = 'Failed to save active list';
        if ( environment.production ) Sentry.captureException(err);
        else console.error(issue + ' |', err);
        this.snackbar.open( issue, 'Dismiss', { duration: 3000, verticalPosition: 'top' } );
      }
    } );
  }

  public newList() {
    this.afAuth.user.pipe(
      take(1),
      switchMap( user => !!user ? this.firestore.collection<List>('lists').add({
        users: [user.uid],
        name: 'New List'
      }) : of(undefined) ),
      catchError( err => {
        const issue = 'Failed to create list';
        if ( environment.production ) Sentry.captureException(err);
        else console.error(issue + ' |', err);
        this.snackbar.open( issue, 'Dismiss', { duration: 3000, verticalPosition: 'top' } );
        return EMPTY;
      } )
    ).subscribe( res => {
      // List created successfully
      this.snackbar.open( 'List created', undefined, { duration: 1000, verticalPosition: 'top' } );
    } );
  }

}
