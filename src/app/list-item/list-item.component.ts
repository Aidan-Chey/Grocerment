import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { Item } from '../item.model';
import { NewItemComponent } from '../new-item/new-item.component';

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
    this.matDialog.open( NewItemComponent, { data: item } ).afterClosed().subscribe( res => {
      if ( !!res ) {
        
      }
    } );
  }

}
