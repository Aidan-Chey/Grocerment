import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { MatDialog } from '@angular/material/dialog';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivationEnd, Router, Event } from '@angular/router';
import { map, shareReplay, filter } from 'rxjs/operators';
import { SelectListComponent, selectListConfig } from '../select-list/select-list.component';
import { AuthService } from '../services/auth.service';
import { FilterService } from '../services/filter.service';
import { ListService } from '../services/list.service';
import { ShowUserIDDialog } from '../show-user-id/show-user-id.dialog';

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

  public readonly pageTitle$ = this.activeRouteSnapshot$.pipe(
    map( event => event.snapshot?.data?.title as string || 'No page title set' ),
    shareReplay(1),
  );

  public readonly pagePath$ = this.activeRouteSnapshot$.pipe(
    map( event => event.snapshot?.routeConfig?.path ),
    shareReplay(1),
  );

  public readonly list$ = this.listService.activeListSubject.asObservable();

  constructor(
    private readonly iconRegistry: MatIconRegistry,
    private readonly sanitizer: DomSanitizer,
    private readonly router: Router,
    public readonly filterService: FilterService,
    private readonly listService: ListService,
    public readonly afAuth: AngularFireAuth,
    private readonly matDialog: MatDialog,
    public readonly authService: AuthService,
  ) {
    this.iconRegistry.addSvgIcon( 'menu', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/burger.svg') );
    this.iconRegistry.addSvgIcon( 'new', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/add.svg') );
    this.iconRegistry.addSvgIcon( 'person', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/person.svg') );
    this.iconRegistry.addSvgIcon( 'need', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/cart.svg') );
    this.iconRegistry.addSvgIcon( 'have', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/refrigerator.svg') );
    this.iconRegistry.addSvgIcon( 'list', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/list.svg') );
  }

  public selectList() {
    const dialogConfig = Object.assign( {}, selectListConfig);
    this.matDialog.open(SelectListComponent, dialogConfig);
  }

  public showUserID() {
    this.dialog.open( ShowUserIDDialog );
  }

}
