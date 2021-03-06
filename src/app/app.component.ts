import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { FirebaseApp } from '@angular/fire';
import { AngularFireAuth } from '@angular/fire/auth';
import { MatIconRegistry } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer } from '@angular/platform-browser';
import { filter } from 'rxjs/operators';
import { AuthService } from '@grocerment-services/auth.service';
import { ColorSchemeService } from '@grocerment-services/color-scheme.service';
import * as Sentry from "@sentry/angular";
import { environment } from '@grocerment-environment';

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
    private readonly colorSchemeService: ColorSchemeService,
    private readonly firebase: FirebaseApp,
    private readonly snackbar: MatSnackBar,
  ) {
    this.colorSchemeService.load();

    // Register svg Icons used in app
    this.iconRegistry.addSvgIcon( 'copy', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/copy.svg') );
    this.iconRegistry.addSvgIcon( 'menu', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/burger.svg') );
    this.iconRegistry.addSvgIcon( 'person', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/person.svg') );
    this.iconRegistry.addSvgIcon( 'cart', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/cart.svg') );
    this.iconRegistry.addSvgIcon( 'have', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/refrigerator.svg') );
    this.iconRegistry.addSvgIcon( 'search', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/magnifying-glass.svg') );
    this.iconRegistry.addSvgIcon( 'edit', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/pencil.svg') );
    this.iconRegistry.addSvgIcon( 'plus', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/plus.svg') );
    this.iconRegistry.addSvgIcon( 'options', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/options.svg') );
    this.iconRegistry.addSvgIcon( 'list', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/list.svg') );
    this.iconRegistry.addSvgIcon( 'trash', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/trash.svg') );
    this.iconRegistry.addSvgIcon( 'star', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/star.svg') );
    this.iconRegistry.addSvgIcon( 'checkbox-empty', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/checkbox-empty.svg') );
    this.iconRegistry.addSvgIcon( 'checkbox-filled', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/checkbox-filled.svg') );
    this.iconRegistry.addSvgIcon( 'disconnected', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/disconnected.svg') );
    this.iconRegistry.addSvgIcon( 'camera', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/camera.svg') );

    // Enable offline persistance of firestore data
    this.firebase.firestore().enablePersistence()
      .catch( err => {
        let issue = '';
          switch (err.code) {
            case 'failed-precondition':
              issue = 'Unable to store data offline, more than one tab of application open';
              break;
            case 'unimplemented':
              issue = 'Unable to store data offline, browser not supported';
              break;
            default:
              if ( environment.production ) Sentry.captureException(err);
              issue = 'Unable to store data offline, unkown issue occured';
          }
          if (issue) this.snackbar.open( issue, 'Dismiss', { duration: 3000, verticalPosition: 'bottom' } );
      } );
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
