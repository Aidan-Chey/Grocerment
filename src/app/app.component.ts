import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
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
  ) { }

  ngAfterViewInit() {
    this.authService.authContainerRef = this.authContainer?.nativeElement;
    
    this.authService.user$.pipe(
      filter( user => !user ),
    ).subscribe( () => {
      this.authService.signIn();
    } );
  }

}
