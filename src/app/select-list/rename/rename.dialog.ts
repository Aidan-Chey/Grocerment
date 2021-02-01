import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-rename',
  templateUrl: './rename.dialog.html',
  styleUrls: ['./rename.dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RenameDialog implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
