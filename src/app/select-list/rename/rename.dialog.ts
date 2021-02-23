import { Component, OnInit, ChangeDetectionStrategy, Inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export const renameConfig = {
	height: 'auto',
	maxHeight: '12em',
};

@Component({
  selector: 'app-rename',
  templateUrl: './rename.dialog.html',
  styleUrls: ['./rename.dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RenameDialog implements OnInit {

  public readonly nameForm = this.fb.group({
    name: [null, Validators.required],
  });

  constructor(
    private readonly fb: FormBuilder,
    public readonly dialogRef: MatDialogRef<RenameDialog>,
		@Inject(MAT_DIALOG_DATA) public data: { name: string },
  ) { }

  ngOnInit(): void {
    this.nameForm.patchValue(this.data);
  }

  onSubmit() {
    if ( !this.nameForm.valid ) {
      this.nameForm.markAllAsTouched();
      return;
    }

    const groupValue = this.nameForm.getRawValue();

    this.dialogRef.close(groupValue);

    return false;
  }

}
