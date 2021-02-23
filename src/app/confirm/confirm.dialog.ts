import { Component, OnInit, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
/** Expected object for injected dialog data */
export type ConfirmData = {
	/** String to use as dialog title, replacing the default */
	title?: string
	/** String to use as dialog content */
	content?: string
	/** String to use as dialog decline button, replacing the default */
	decline?: string
	/** String to use as dialog accept button, replaceing the default */
	accept?: string
};

export const confirmConfig = {
	height: 'auto',
	maxHeight: '17em',
};

@Component({
	selector: 'app-confirm',
	templateUrl: './confirm.dialog.html',
	styleUrls: ['./confirm.dialog.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmDialog implements OnInit {

	constructor(
		@Inject(MAT_DIALOG_DATA) public data: ConfirmData,
	) { }

	ngOnInit(): void {
	}

}
