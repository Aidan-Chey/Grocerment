import { AfterViewInit, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { catchError, filter, shareReplay, switchMap, take, withLatestFrom } from 'rxjs/operators';
import { EMPTY, of, } from 'rxjs';
import { List } from '../models/list.model';
import { ListService } from '../services/list.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmData, ConfirmDialog } from '../confirm/confirm.dialog';
import { environment } from 'src/environments/environment';
import * as Sentry from '@sentry/angular';
import { RenameDialog } from './rename/rename.dialog';
import { UsersDialog } from './users/users.dialog';

export const selectListConfig = {
	minWidth: '5em',
	width: '95vw',
	maxWidth: '50em',
	maxHeight: '95vh',
};

@Component({
  selector: 'app-select-list',
  templateUrl: './select-list.component.html',
  styleUrls: ['./select-list.component.scss']
})
export class SelectListComponent implements OnInit, AfterViewInit {

  public readonly lists$ = this.listService.listsCollectionRef$.pipe(
	switchMap( ref => ref.valueChanges({idField: 'id'}) ),
	shareReplay(1),
  );

  constructor(
	private readonly snackbar: MatSnackBar,
	public readonly listService: ListService,
	public readonly dialog: MatDialog,
  ) {
  }

  ngOnInit(): void {

  }

  ngAfterViewInit() {
	
  }

  // Updates active list
  setActiveList( list: List ) {
	if ( !!list ) this.listService.activeListSubject.next(list);
  }

  /** Delete a list */
  deleteList( list: List ) {
	if ( !list.id ) return;

	const toEdit = list.id;
	const data = {
	  title: 'Are you sure?',
	  content: `You are about to delete the list ${list.name}? Everyone will loose access to the list and it's items will be deleted; this data will not be recoverable!`,
	  accept: 'Delete list',
	  decline: 'Cancel',
	} as ConfirmData;

	// activate dialog as check
	this.dialog.open( ConfirmDialog, { data, height: 'auto' } ).afterClosed().pipe(
	  take(1),
	  filter(choice => !!choice ),
	  withLatestFrom( this.listService.listsCollectionRef$ ),
	  switchMap( ([choice, ref]) => ref.doc(toEdit).delete() ),
	  catchError( err => {
		const issue = 'Failed to delete list';
		if ( environment.production ) Sentry.captureException(err);
		else console.error(issue + ' |', err);
		this.snackbar.open( issue, 'Dismiss', { duration: 3000, verticalPosition: 'bottom' } );
		return EMPTY;
	  } )
	).subscribe( () => {
	  // List deleted successfully
	  this.snackbar.open( 'List deleted', undefined, { duration: 1000, verticalPosition: 'bottom' } );
	} );
  }

  /** Change the name of a list */
  renameList( list: List ) {
	if ( !list.id ) return;

	const toEdit = list.id;
	const data = {
	  name: list.name,
	}
	this.dialog.open( RenameDialog, { data, height: 'auto' } ).afterClosed().pipe(
	  take(1),
	  filter(revision => !!revision ),
	  withLatestFrom( this.listService.listsCollectionRef$ ),
	  switchMap( ([revision,ref]) => ref.doc(toEdit).update(revision) ),
	  catchError( err => {
		const issue = 'Failed to rename list';
		if ( environment.production ) Sentry.captureException(err);
		else console.error(issue + ' |', err);
		this.snackbar.open( issue, 'Dismiss', { duration: 3000, verticalPosition: 'bottom' } );
		return EMPTY;
	  } )
	).subscribe( () => {
	  // List renamed successfully
	  this.snackbar.open( 'List renamed', undefined, { duration: 1000, verticalPosition: 'bottom' } );
	} );
	
  }

  /** Add or remove users from a list */
  editListUsers( list: List ) {
	if ( !list.id ) return;

	const toEdit = list.id;
	const data = {
	  users: list.users,
	}
	this.dialog.open( UsersDialog, { data, height: 'auto' } ).afterClosed().pipe(
	  take(1),
	  filter(revision => !!revision ),
	  withLatestFrom( this.listService.listsCollectionRef$ ),
	  switchMap( ([revision,ref]) => ref.doc(toEdit).update(revision) ),
	  catchError( err => {
		const issue = 'Failed to save list users';
		if ( environment.production ) Sentry.captureException(err);
		else console.error(issue + ' |', err);
		this.snackbar.open( issue, 'Dismiss', { duration: 3000, verticalPosition: 'bottom' } );
		return EMPTY;
	  } )
	).subscribe( () => {
	  // List renamed successfully
	  this.snackbar.open( 'List users saved', undefined, { duration: 1000, verticalPosition: 'bottom' } );
	} );
  } 

  /** Tracks loop entries by their ID */
  public trackByID(index:number, el:any): number {
    return el.id;
  }

}
