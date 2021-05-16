import { Component, OnInit, ChangeDetectionStrategy, Inject, ViewChildren, QueryList, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { FormArray, FormBuilder, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import QrScanner from 'qr-scanner';
import { from } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

export const usersConfig = {
  height: 'auto',
  maxHeight: '25em',
};

@Component({
  selector: 'app-users',
  templateUrl: './users.dialog.html',
  styleUrls: ['./users.dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersDialog implements OnInit, OnDestroy, AfterViewInit {

  @ViewChildren('user', { read: ElementRef }) usersList?: QueryList<ElementRef<HTMLInputElement>>;
  @ViewChild('preview') videoElement?: ElementRef<HTMLVideoElement>;
  public readonly usersArray = this.fb.array([]);
  public readonly usersForm = this.fb.group({
    users: this.usersArray,
  });
  public showVideoElement = false;
  public hasCamera$ = from(QrScanner.hasCamera()).pipe(
    shareReplay(1),
  );
  private scanningUserIndex: number | undefined = undefined;
  private qrScanner: QrScanner | undefined = undefined;

  constructor(
    private readonly fb: FormBuilder,
    public readonly afAuth: AngularFireAuth,
    public readonly dialogRef: MatDialogRef<UsersDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { users: string[] },
  ) {
    QrScanner.WORKER_PATH = '/assets/scripts/qr-scanner-worker.min.js';
  }

  ngOnInit(): void {
    if ( Array.isArray(this.data?.users) ) {
      this.data.users.forEach( user => {
        this.usersArray.push( new FormControl(user) );
      } );
    }
  }

  ngAfterViewInit() {
    if ( !!this.videoElement ) {
      this.qrScanner = new QrScanner(this.videoElement.nativeElement, code => {
          if ( !code ) return;
          this.stopScanning();
          if ( !!this.scanningUserIndex ) {
            const users = this.usersForm.get('users') as FormArray;
            users.at(this.scanningUserIndex).setValue(code);
          }
      });

      QrScanner
    }
  }

  addUser() {
    this.usersArray.push( new FormControl(null) );
    setTimeout(() => {
      this.usersList?.last.nativeElement.focus();
    }, 0);
  }

  onSubmit() {
    if ( !this.usersForm.valid ) {
      this.usersForm.markAllAsTouched();
      return;
    }

    const groupValue = this.usersForm.getRawValue();

    this.dialogRef.close(groupValue);

    return false;
  }

  ngOnDestroy() {
    // Stop looking for a QR code if still looking
    this.stopScanning();
    if ( !!this.qrScanner ) {
      this.qrScanner.destroy();
      this.qrScanner = undefined;
    } 
  }

  /** Show video preview and attempt to detect QR code to use as new User ID */
  scanCode(index: number) {
      
    if ( !!this.qrScanner ) {
      this.showVideoElement = true;
      this.scanningUserIndex = index;
      this.qrScanner.start();
    }

  }

  /** Stops using the video stream to look for QR Codes */
  stopScanning() {
    this.showVideoElement = false;
    if ( !!this.qrScanner ) this.qrScanner.stop();
  }

}
