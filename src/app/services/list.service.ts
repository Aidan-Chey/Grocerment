import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AngularFirestore } from '@angular/fire/firestore';
import { BehaviorSubject, combineLatest, EMPTY, from, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { List } from '../models/list.model';
import * as Sentry from '@sentry/angular';
import { catchError, map, shareReplay, startWith, switchMap, take, takeUntil } from 'rxjs/operators';
import { AngularFireAuth } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class ListService {

  public readonly activeListSubject = new BehaviorSubject<List | undefined>(undefined);
  public get activeList() { return this.activeListSubject.getValue(); }
  
  public readonly listsCollectionRef$ = this.afAuth.user.pipe(
    map( user => !!user ? this.firestore.collection<List>('lists', ref => ref.where('users','array-contains',user.uid)) : undefined ),
    shareReplay(1),
  );
  public readonly lists$ = this.listsCollectionRef$.pipe(
    switchMap( ref => !!ref ? merge(
      ref.valueChanges({idField: 'id'}),
      ref.get().pipe( map( data => data.docs.map( doc => doc.data ) ), mergeAll() ),
    ) : of([]) ),
    shareReplay(1),
  );

  constructor(
    private readonly firestore: AngularFirestore,
    private readonly snackbar: MatSnackBar,
    private readonly afAuth: AngularFireAuth,
  ) {
    // Retrieve active list from storage if set on app init
    try {
      const storedlist = localStorage.getItem('activeList');
      if ( !!storedlist && storedlist !== 'undefined' ) this.activeListSubject.next(JSON.parse(storedlist));
    } catch (err) {
      const issue = 'Failed to retrieving active list';
      if ( environment.production ) Sentry.captureException(err);
      else console.error(issue + ' |', err);
      this.snackbar.open( issue, 'Dismiss', { duration: 3000, verticalPosition: 'bottom' } );
    }
    // Looks for a list to set as the active list on app init
    if ( !this.activeListSubject.getValue() ) {
      this.lists$.pipe(
        takeUntil(this.activeListSubject.asObservable()),
      ).subscribe( lists => {
        // If no lists, create one
        if ( !Array.isArray(lists) || !lists.length ) {
          this.newList('Personal', true, true);
          return;
        }
        // Select a new active list
        if ( !this.activeListSubject.getValue() && !!Array.isArray(lists) && !!lists.length ) 
          this.activeListSubject.next(lists[0]);
      } );
    }
    // Saves active list to localstorage for retrieval on init
    combineLatest([
      this.activeListSubject.asObservable(),
      this.lists$,
    ]).subscribe( ([activeList,lists]) => {
      // Don't continue if no active list set
      if ( !activeList || !Array.isArray(lists) ) return;
      if ( !lists.some( list => !!list.personal ) ) this.newList('Personal', false, true);
      // If active list doesn't match any list, change to first list
      if ( !lists.some( list => list.id === activeList.id ) ) {
        this.activeListSubject.next(lists[0]);
        return;
      }
      // Save active list to local storage for later retrieval
      try {
        localStorage.setItem('activeList', JSON.stringify(activeList));
      } catch (err) {
        const issue = 'Failed to save active list';
        if ( environment.production ) Sentry.captureException(err);
        else console.error(issue + ' |', err);
        this.snackbar.open( issue, 'Dismiss', { duration: 3000, verticalPosition: 'bottom' } );
      }
    } );

    // Removes localstorage & clears variables on logout
    this.afAuth.user.pipe(
      filter(res => !res),
    ).subscribe( () => {
      localStorage.removeItem('activeList');
      this.activeListSubject.next(undefined);
    } );

  }

  public newList( name = 'New List', active = false, personal = false ) {
    this.afAuth.user.pipe(
      take(1),
      switchMap( user => !!user ? this.firestore.collection<List>('lists').add({
        users: [user.uid],
        name,
        personal,
        items: [],
      }) : of(undefined) ),
      catchError( err => {
        const issue = 'Failed to create list';
        if ( environment.production ) Sentry.captureException(err);
        else console.error(issue + ' |', err);
        this.snackbar.open( issue, 'Dismiss', { duration: 3000, verticalPosition: 'bottom' } );
        return EMPTY;
      } ),
      switchMap( res => !!res ? from(res.get()) : EMPTY )
    ).subscribe( list => {
      // Set new list as active list
      if ( active ) {
        const listData = list.data();
        const id = list.id;
        this.activeListSubject.next({ id, ...listData } as List);
      }
      // List created successfully
      this.snackbar.open( 'List created', undefined, { duration: 1000, verticalPosition: 'bottom' } );
    } );
  }

}
