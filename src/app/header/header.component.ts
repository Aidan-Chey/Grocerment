import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { MatDialog } from '@angular/material/dialog';
import { ActivationEnd, Router, Event } from '@angular/router';
import { EditItemComponent, editItemConfig } from '@grocerment-app/edit-item/edit-item.component';
import { Item } from '@grocerment-models/item.model';
import { ItemService } from '@grocerment-services/item.service';
import { combineLatest, EMPTY } from 'rxjs';
import { map, shareReplay, filter, switchMap, first } from 'rxjs/operators';
import { AuthService } from '@grocerment-services/auth.service';
import { ColorSchemeService } from '@grocerment-services/color-scheme.service';
import { FilterService } from '@grocerment-services/filter.service';
import { ListService } from '@grocerment-services/list.service';
import { OnlineStateService } from '@grocerment-services/online-state.service';
import { ServiceWorkerService } from '@grocerment-services/service-worker.service';
import { ShowUserIDDialog } from '@grocerment-app/show-user-id/show-user-id.dialog';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  public isLoggedIn = false;

  private readonly activeRouteSnapshot$ = this.router.events.pipe(
    filter( (event: Event): event is ActivationEnd => (event instanceof ActivationEnd) ),
    shareReplay(1),
  );

  public readonly pagePath$ = this.activeRouteSnapshot$.pipe(
    map( event => event.snapshot?.routeConfig?.path ),
    shareReplay(1),
  );

  public readonly list$ = this.listService.activeListSubject.asObservable();

  public readonly pageTitle$ = combineLatest([
    this.activeRouteSnapshot$,
    this.list$,
  ]).pipe(
    map( ([event,activeList]) => event.snapshot?.data?.title as string || activeList?.name || 'No page title set' ),
    shareReplay(1),
  );

  public readonly titleRoute$ = this.pageTitle$.pipe(
    map( title => {
      switch(title) {
        case 'I Need...':
          return '/have';
        case 'I Have...':
          return '/need';
        default:
          return null;
      }
    } ),
    shareReplay(1),
  );

  constructor(
    private readonly router: Router,
    public readonly filterService: FilterService,
    private readonly listService: ListService,
    public readonly afAuth: AngularFireAuth,
    public readonly dialog: MatDialog,
    public readonly authService: AuthService,
    public readonly updateService: ServiceWorkerService,
    public readonly colorSchemeService: ColorSchemeService,
    public readonly onlineState: OnlineStateService,
    private readonly itemService: ItemService,
  ) {
  }

  ngOnInit(): void {
  }

  public showUserID() {
    this.dialog.open( ShowUserIDDialog, {
      height: 'auto',
      maxHeight: '35em',
    });
  }

  public openCreateItemDialog() {
    const data = {} as Item;

    if ( !!this.filterService.filterTerm ) data.name = this.filterService.filterTerm;

    const dialogConfig = {
      ...editItemConfig,
      height: 'auto',
      data,
    };
    this.dialog.open(EditItemComponent, dialogConfig).afterClosed().pipe(
      switchMap( item => !!item ? this.itemService.createItem( item ) : EMPTY ),
    ).subscribe();
  }

  /** Marks all favoured items as not obtained, adding them to the shopping list */
  public addFavourites(): void {

    this.listService.items$.pipe(
      first(),
      switchMap( items => {
        const favourites = items.filter( item => !!item.favourite )

        return this.itemService.batchEdit(favourites, { obtained: false } as Item );
      } ),
    ).subscribe( res => {
      // Error occured and user opted to retry
      if ( !!res ) this.addFavourites();
    } );
    

  }

}
