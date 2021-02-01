import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-users',
  templateUrl: './users.dialog.html',
  styleUrls: ['./users.dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersDialog implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
