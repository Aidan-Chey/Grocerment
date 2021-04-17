import { Component, Input } from '@angular/core';
import { Item } from '../models/item.model';

@Component({
  selector: 'app-list-have',
  templateUrl: './list-have.component.html',
  styleUrls: ['./list-have.component.scss']
})
export class ListHaveComponent {

  @Input('items') inputItems: Item[] = [];

  constructor(
  ) { }

  /** Tracks items by their ID */
  public trackByItemID(index:number, el:any): number {
    return el.id;
  }

}
