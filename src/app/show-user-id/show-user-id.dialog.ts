import { Component, OnInit, ChangeDetectionStrategy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef } from '@angular/material/dialog';
import { environment } from 'src/environments/environment';
import * as Sentry from '@sentry/angular';
import { take } from 'rxjs/operators';
import { MatButton } from '@angular/material/button';

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
    this.shareButton?.nativeElement.addEventListener( 'click', event => {
      this.afAuth.user.pipe( take(1) ).subscribe( user => {
        if ( !user ) return;
        if ( !!navigator.share ) {
          navigator.share({
            title: 'Grocerment user UID',
            text: user.uid,
          }).then(() => {
            this.snackbar.open( 'Shared', undefined, { duration: 1000, verticalPosition: 'top' } );
          })
          .catch( err => {
            const issue = 'Failed to copy';
            if ( environment.production ) Sentry.captureException(err);
            else console.error(issue + ' |', err);
            this.snackbar.open( issue, undefined, { duration: 2000, verticalPosition: 'top', panelClass: "error" } );
          });
          return;
        }
        if ( !!this.clipboard.copy(user.uid) ) {
          this.snackbar.open( 'Copied', undefined, { duration: 1000, verticalPosition: 'top' } );
          this.dialogRef.close();
        } else {
          this.snackbar.open( 'Failed to copy', undefined, { duration: 2000, verticalPosition: 'top', panelClass: "error" } );
        }
      } );
    } );
  }

  public addToClipboard( event: Event, toCopy: string ) {
    
  }

}
