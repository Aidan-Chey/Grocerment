import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { MatDialog } from '@angular/material/dialog';
import { ActivationEnd, Router, Event } from '@angular/router';
import { map, shareReplay, filter } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { ColorSchemeService } from '../services/color-scheme.service';
import { FilterService } from '../services/filter.service';
import { ListService } from '../services/list.service';
import { OnlineStateService } from '../services/online-state.service';
import { ServiceWorkerService } from '../services/service-worker.service';
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
    private readonly router: Router,
    public readonly filterService: FilterService,
    private readonly listService: ListService,
    public readonly afAuth: AngularFireAuth,
    public readonly dialog: MatDialog,
    public readonly authService: AuthService,
    public readonly updateService: ServiceWorkerService,
    public readonly colorSchemeService: ColorSchemeService,
    public readonly onlineState: OnlineStateService,
  ) {
  }

  ngOnInit(): void {
  }

  public showUserID() {
    this.dialog.open( ShowUserIDDialog, {
      height: 'auto',
      maxHeight: '8em',
    });
  }

}
