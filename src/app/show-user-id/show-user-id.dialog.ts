import { Component, OnInit, ChangeDetectionStrategy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef } from '@angular/material/dialog';
import { environment } from 'src/environments/environment';
import * as Sentry from '@sentry/angular';
import { filter, switchMap, tap } from 'rxjs/operators';
import { fromEvent } from 'rxjs';

@Component({
  selector: 'app-show-user-id',
  templateUrl: './show-user-id.dialog.html',
  styleUrls: ['./show-user-id.dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShowUserIDDialog implements OnInit, AfterViewInit {

  @ViewChild('shareButton', { read: ElementRef }) shareButton?: ElementRef<HTMLButtonElement>;

  constructor(
    public readonly afAuth: AngularFireAuth,
    private readonly clipboard: Clipboard,
    private readonly snackbar: MatSnackBar,
    private readonly dialogRef: MatDialogRef<ShowUserIDDialog>,
  ) {
  }

  ngOnInit(): void {
    
  }

  ngAfterViewInit() {
    if( !!this.shareButton ) fromEvent( this.shareButton.nativeElement , 'click' ).pipe(
      switchMap( () => this.afAuth.user ),
    ).subscribe( (user) => {
      if ( !user )  this.snackbar.open( 'No user loaded', undefined, { duration: 2000, verticalPosition: 'top', panelClass: "error" } );
      else if ( !!navigator.share ) {
        navigator.share({
          title: 'Grocerment user UID',
          text: user.uid,
        }).then(() => {
          this.snackbar.open( 'Shared', undefined, { duration: 1000, verticalPosition: 'top' } );
        }).catch( err => {
          console.debug(err, err.message, err.toString());
          if ( err.message.toLowerCase().includes('share canceled') ) {
            // Triggers when the share is canceled or copied
            this.snackbar.open( 'Share canceled', undefined, { duration: 2000, verticalPosition: 'top', panelClass: "error" } );
          } else {
            const issue = 'Failed to share';
            if ( environment.production ) Sentry.captureException(err);
            else console.error(issue + ' |', err);
            this.snackbar.open( issue, undefined, { duration: 2000, verticalPosition: 'top', panelClass: "error" } );
          }
        });
      }
      else {
        if ( !!this.clipboard.copy(user.uid) ) this.snackbar.open( 'Copied', undefined, { duration: 1000, verticalPosition: 'top' } );
        else this.snackbar.open( 'Failed to copy', undefined, { duration: 2000, verticalPosition: 'top', panelClass: "error" } );
      }
      
      this.dialogRef.close();

    } );
  }

}
