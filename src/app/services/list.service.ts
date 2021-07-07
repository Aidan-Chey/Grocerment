import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AngularFirestore } from '@angular/fire/firestore';
import { BehaviorSubject, combineLatest, EMPTY, from } from 'rxjs';
import { environment } from '@grocerment-environment';
import { List } from '@grocerment-models/list.model';
import * as Sentry from '@sentry/angular';
import { auditTime, catchError, filter, first, map, shareReplay, switchMap, takeUntil } from 'rxjs/operators';
import { AngularFireAuth } from '@angular/fire/auth';
import notEmpty from 'src/app/globals/not-empty-filter';
import { Item } from '@grocerment-models/item.model';

@Injectable({
  providedIn: 'root'
})
export class ListService {

  public readonly activeListSubject = new BehaviorSubject<List | undefined>(undefined);
  public get activeList() { return this.activeListSubject.getValue(); }
  /** Reference to fireStore list collections */
  public readonly listsCollectionRef$ = this.afAuth.user.pipe(
    filter( notEmpty ),
    map( user => this.firestore.collection<List>('lists', ref => ref.where('users','array-contains',user.uid)) ),
    shareReplay(1),
  );
  /** list of avaliable lists to pick from */
  public readonly lists$ = this.listsCollectionRef$.pipe(
    switchMap( ref => ref.valueChanges({idField: 'id'}) ),
    shareReplay(1),
  );

  /** list of items from the store */
  public readonly items$ = combineLatest([
    this.listsCollectionRef$,
    this.activeListSubject.asObservable(),
  ]).pipe( // Get logged in user UID
    auditTime(50),
    // Use UID to get their items
    switchMap( ([ref,activeList]) => ref
      .doc(activeList?.id)
      .collection<Item>('items')
      .valueChanges({idField: 'id'}) 
    ),
    catchError( err => {
      const issue = 'Failed to retrieve items';
      if ( environment.production ) Sentry.captureException(err);
      else console.error(issue + ' |', err);
      this.snackbar.open( issue, 'Dismiss', { duration: 3000, verticalPosition: 'bottom' } );
      return EMPTY;
    } ),
    map( items => items.sort(this.itemCompareFn) ),
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
        takeUntil(this.activeListSubject.asObservable().pipe(
          filter(active => !!active)
        )),
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
    ]).pipe(
      auditTime(500),
    ).subscribe( ([activeList,lists]) => {
      // Don't continue if no active list set
      if ( !activeList || !Array.isArray(lists) || !lists.length ) return;
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
      filter( notEmpty ),
      first(),
      switchMap( user => this.firestore.collection<List>('lists').add({
        users: [user.uid],
        name,
        personal,
        items: [],
      }) ),
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

  /** Function to compare two items by comparing their `name` property. */
  private itemCompareFn(a: Item, b: Item) {
    const aName = a.name?.toLowerCase();
    const bName = b.name?.toLowerCase();
    if (aName < bName)
      return -1;
    if (aName > bName)
      return 1;
    return 0;
  };

}
