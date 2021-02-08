import { Component, Input, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { combineLatest, EMPTY, of } from 'rxjs';
import { catchError, switchMap, take } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { EditItemComponent, editItemConfig } from '../edit-item/edit-item.component';
import { Item } from '../models/item.model';
import * as Sentry from '@sentry/angular';
import { ListService } from '../services/list.service';
import { List } from '../models/list.model';
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
