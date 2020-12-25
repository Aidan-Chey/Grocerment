import { Component, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { map, shareReplay, filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  public readonly activePage$ = this.router.events.pipe(
    filter( event => event instanceof NavigationEnd ),
    map( (event: NavigationEnd) => {
      console.log(event);
      if( true ) return 'no page set';
      // return data.title;
    } ),
    shareReplay(1),
  );

  constructor(
    private readonly iconRegistry: MatIconRegistry,
    private readonly sanitizer: DomSanitizer,
    private readonly router: Router,
  ) {
    this.iconRegistry.addSvgIcon( 'menu', sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/burger.svg') );
    this.iconRegistry.addSvgIcon( 'new', sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/add.svg') );
    this.iconRegistry.addSvgIcon( 'login', sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/burger.svg') );
    this.iconRegistry.addSvgIcon( 'logout', sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/burger.svg') );
    this.iconRegistry.addSvgIcon( 'need', sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/cart.svg') );
    this.iconRegistry.addSvgIcon( 'have', sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/refrigerator.svg') );
  }

  ngOnInit(): void {
  }

  login() {}
  logout() {}

}
