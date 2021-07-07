import { Component, OnInit, ChangeDetectionStrategy, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef } from '@angular/material/dialog';
import { environment } from '@grocerment-environment';
import * as Sentry from '@sentry/angular';
import { filter, first, map, switchMap, takeUntil } from 'rxjs/operators';
import { fromEvent, Subject } from 'rxjs';
import notEmpty from 'src/app/globals/not-empty-filter';
import * as qrcodeGenerator from 'qrcode-generator';

@Component({
  selector: 'app-show-user-id',
  templateUrl: './show-user-id.dialog.html',
  styleUrls: ['./show-user-id.dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShowUserIDDialog implements OnInit, AfterViewInit, OnDestroy {

  private readonly componentDestruction$ = new Subject();

  @ViewChild('shareButton', { read: ElementRef }) shareButton?: ElementRef<HTMLButtonElement>;

  public readonly qrCode$ = this.afAuth.user.pipe(
    filter( notEmpty ),
    map( user => {
      const constructor = qrcodeGenerator(0,'M');
      constructor.addData(user.uid);
      constructor.make();
      return constructor.createSvgTag({
        cellSize: 2,
        margin: 2,
        scalable: true,
      });
    } ),
  );

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
      takeUntil(this.componentDestruction$),
      switchMap( () => this.afAuth.user.pipe( filter( notEmpty ), first() ) ),
    ).subscribe( (user) => {
      if ( !user )  this.snackbar.open( 'No user loaded', undefined, { duration: 2000, verticalPosition: 'bottom', panelClass: "error" } );
      else if ( !!navigator.share ) {
        navigator.share({
          title: 'Grocerment user UID',
          text: user.uid,
        }).then(() => {
          this.snackbar.open( 'Shared', undefined, { duration: 1000, verticalPosition: 'bottom' } );
        }).catch( err => {
          if ( !err.message.toLowerCase().includes('share canceled') ) {
            const issue = 'Failed to share';
            if ( environment.production ) Sentry.captureException(err);
            else console.error(issue + ' |', err);
            this.snackbar.open( issue, undefined, { duration: 2000, verticalPosition: 'bottom', panelClass: "error" } );
          }
        });
      }
      else {
        if ( !!this.clipboard.copy(user.uid) ) this.snackbar.open( 'Copied', undefined, { duration: 1000, verticalPosition: 'bottom' } );
        else this.snackbar.open( 'Failed to copy', undefined, { duration: 2000, verticalPosition: 'bottom', panelClass: "error" } );
      }
      
      this.dialogRef.close();

    } );
  }

  ngOnDestroy() {
    this.componentDestruction$.next();
  }

}
