import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  @ViewChild('authContainer') authContainer!: ElementRef<HTMLElement>;
  @ViewChild('loader') loader!: ElementRef<HTMLElement>;

  constructor(
    public readonly authService: AuthService,
    public readonly afAuth: AngularFireAuth,
    private readonly iconRegistry: MatIconRegistry,
    private readonly sanitizer: DomSanitizer,
  ) {
    this.iconRegistry.addSvgIcon( 'copy', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/copy.svg') );
    this.iconRegistry.addSvgIcon( 'menu', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/burger.svg') );
    this.iconRegistry.addSvgIcon( 'person', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/person.svg') );
    this.iconRegistry.addSvgIcon( 'need', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/cart.svg') );
    this.iconRegistry.addSvgIcon( 'have', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/refrigerator.svg') );
    this.iconRegistry.addSvgIcon( 'search', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/magnifying-glass.svg') );
    this.iconRegistry.addSvgIcon( 'edit', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/pencil.svg') );
    this.iconRegistry.addSvgIcon( 'plus', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/plus.svg') );
    this.iconRegistry.addSvgIcon( 'options', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/options.svg') );
    this.iconRegistry.addSvgIcon( 'list', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/list.svg') );
    this.iconRegistry.addSvgIcon( 'trash', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/trash.svg') );
  }

  ngAfterViewInit() {
    this.authService.authContainerRef = this.authContainer?.nativeElement;
    
    this.afAuth.user.pipe(
      filter( user => !user ),
    ).subscribe( () => {
      this.authService.signIn();
    } );
  }

}
