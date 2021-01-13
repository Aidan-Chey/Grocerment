import { Component, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivationEnd, Router, Event } from '@angular/router';
import { map, shareReplay, filter } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { FilterService } from '../services/filter.service';

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

  constructor(
    private readonly iconRegistry: MatIconRegistry,
    private readonly sanitizer: DomSanitizer,
    private readonly router: Router,
    public readonly filterService: FilterService,
    public readonly authService: AuthService,
  ) {
    this.iconRegistry.addSvgIcon( 'menu', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/burger.svg') );
    this.iconRegistry.addSvgIcon( 'new', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/add.svg') );
    this.iconRegistry.addSvgIcon( 'person', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/person.svg') );
    this.iconRegistry.addSvgIcon( 'need', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/cart.svg') );
    this.iconRegistry.addSvgIcon( 'have', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/refrigerator.svg') );
  }

  ngOnInit(): void {
  }

}
