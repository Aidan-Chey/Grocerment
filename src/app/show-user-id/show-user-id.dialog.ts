import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-show-user-id',
  templateUrl: './show-user-id.dialog.html',
  styleUrls: ['./show-user-id.dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShowUserIDDialog implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
