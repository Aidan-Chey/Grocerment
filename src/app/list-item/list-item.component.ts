import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { Item } from '../item.model';

@Component({
  selector: 'app-list-item',
  templateUrl: './list-item.component.html',
  styleUrls: ['./list-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListItemComponent implements OnInit {

  @Input() item = {} as Item;

  constructor( ) { }

  ngOnInit(): void {
  }

}
