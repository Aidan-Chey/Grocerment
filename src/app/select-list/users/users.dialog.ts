import { Component, OnInit, ChangeDetectionStrategy, Inject, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { FormBuilder, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

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
export class UsersDialog implements OnInit {

  @ViewChildren('user', { read: ElementRef }) usersList?: QueryList<ElementRef<HTMLInputElement>>;

  public readonly usersArray = this.fb.array([]);
  public readonly usersForm = this.fb.group({
    users: this.usersArray,
  });

  constructor(
    private readonly fb: FormBuilder,
    public readonly afAuth: AngularFireAuth,
    public readonly dialogRef: MatDialogRef<UsersDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { users: string[] },
  ) { }

  ngOnInit(): void {
    if ( Array.isArray(this.data?.users) ) {
      this.data.users.forEach( user => {
        this.usersArray.push( new FormControl(user) );
      } );
    }
  }

  addUser() {
    this.usersArray.push( new FormControl(null) );
    setTimeout(() => {
      console.log(this.usersList?.last.nativeElement.focus());
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

}
