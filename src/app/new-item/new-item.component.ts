import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { EMPTY } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { EditItemComponent, editItemConfig } from '../edit-item/edit-item.component';
import { ItemService } from '../services/item.service';

@Component({
  selector: 'app-new-item',
  templateUrl: './new-item.component.html',
  styleUrls: ['./new-item.component.scss']
})
export class NewItemComponent implements OnInit {

  @Input() obtained = false;

  constructor(
    private readonly matDialog: MatDialog,
    private readonly itemService: ItemService,
   ) {
  }

  ngOnInit(): void {
  }

  public openDialog( item = { obtained: this.obtained } ) {
    
    const dialogConfig = Object.assign({ data: item }, editItemConfig);
    this.matDialog.open(EditItemComponent, dialogConfig).afterClosed().pipe(
      switchMap( item => !!item ? this.itemService.createItem( item ) : EMPTY ),
    ).subscribe();

  }

}
