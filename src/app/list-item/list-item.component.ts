import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { EditItemComponent, editItemConfig } from '../edit-item/edit-item.component';
import { Item } from '../item.model';

@Component({
  selector: 'app-list-item',
  templateUrl: './list-item.component.html',
  styleUrls: ['./list-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListItemComponent implements OnInit {

  @Input() item = {} as Item;

  constructor(
    private readonly iconRegistry: MatIconRegistry,
    private readonly sanitizer: DomSanitizer,
    private readonly matDialog: MatDialog,
  ) {
    this.iconRegistry.addSvgIcon( 'edit', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/pencil.svg') );
  }

  ngOnInit(): void {
  }

  /** Open item editing dialog */
  editItem( item: Item ) {
    const dialogConfig = Object.assign({ data: item }, editItemConfig);
    this.matDialog.open( EditItemComponent, { data: item } ).afterClosed().subscribe( res => {
      if ( !!res ) {
        
      }
    } );
  }

}
