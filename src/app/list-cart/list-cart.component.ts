import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmData, ConfirmDialog } from '@grocerment-app/confirm/confirm.dialog';
import notEmpty from '@grocerment-app/globals/not-empty-filter';
import { Item } from '@grocerment-app/models/item.model';
import { ItemService } from '@grocerment-app/services/item.service';
import { filter, first, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-list-cart',
  templateUrl: './list-cart.component.html',
  styleUrls: ['./list-cart.component.scss']
})
export class ListCartComponent implements OnInit {

  @Input('items') inputItems: Item[] = [];

  constructor(
    private readonly dialog: MatDialog,
    private readonly itemService: ItemService,
  ) { }

  ngOnInit(): void {
  }

  /** Clears the shopping cart of all items, making them appear on the need list agian */
  public clearCart() {
    const data = {
      title: 'Clear Shopping Cart',
      content: 'Please confirm you wish to clear the shopping cart',
      accept: 'Clear',
      decline: 'Cancel',
    } as ConfirmData;

    this.dialog.open( ConfirmDialog, { data, maxHeight: '12em' } ).afterClosed().pipe(
      first(),
      filter( notEmpty ),
    ).subscribe( () => {
      this.cartItemRefs$.next([]);
    } );
  }

  /** Begins the checkout process for bulk editing the cart items */
  public checkout() {
    const data = {
      title: 'Checkout Shopping Cart',
      content: 'Please confirm you wish to move the shopping cart items to your "I have" list',
      accept: 'Checkout',
      decline: 'Cancel',
    } as ConfirmData;

    this.dialog.open( ConfirmDialog, { data, maxHeight: '13em' } ).afterClosed().pipe(
      first(),
      filter( notEmpty ),
      switchMap( () => this.cartItems$ ),
      first(),
      switchMap( items => this.itemService.batchEdit( items, { obtained: true } as Item ) ),
    ).subscribe( res => {
      // Error occured and user opted to retry
      if ( !!res ) this.checkout();
      // Operation completed successfully
      else this.cartItemRefs$.next([]);
    } );
  }
  
  /** Removes item from shopping cart */
  public removeFromCart( toRemove: Item ) {
    const itemCart = this.cartItemRefs$.getValue();
    this.cartItemRefs$.next( itemCart.filter( item => item !== toRemove.id ) );
  }

}
