import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AngularFirestore } from '@angular/fire/firestore';
import { BehaviorSubject, combineLatest, EMPTY, from, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { List } from '../models/list.model';
import * as Sentry from '@sentry/angular';
import { catchError, map, shareReplay, switchMap, take, takeUntil } from 'rxjs/operators';
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
    switchMap( ref => !!ref ? ref.valueChanges({idField: 'id'}) : of(undefined) ),
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
      else this.newList('Personal', true);
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
        else this.newList('Personal', true, true);
      } );
    }
    // Saves set active list for retrieval on init
    combineLatest([
      this.activeListSubject.asObservable(),
      this.lists$,
    ]).subscribe( ([activeList,lists]) => {
      // Don't continue if no active list set
      if ( !activeList ) return;
      // If no lists, create one
      if ( !Array.isArray(lists) || !lists.length ) {
        this.newList('Personal', true, true);
        return;
      }
      if ( !lists.some( list => !!list.personal ) ) this.newList('Personal', false, true);
      // If active list doesn't match any list, change to first list
      if ( !lists.some( list => list.id === activeList.id ) ) {
        this.activeListSubject.next(lists[0]);
        return;
      }
      // Save active list ot local storage for later retrieval
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
        this.snackbar.open( issue, 'Dismiss', { duration: 3000, verticalPosition: 'top' } );
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
      this.snackbar.open( 'List created', undefined, { duration: 1000, verticalPosition: 'top' } );
    } );
  }

}
