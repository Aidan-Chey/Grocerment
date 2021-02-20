import {Injectable, Renderer2, RendererFactory2} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ColorSchemeService {

  private readonly renderer: Renderer2;
  private colorScheme: Scheme = 'dark';

  constructor(rendererFactory: RendererFactory2) {
    // Create new renderer from renderFactory, to make it possible to use renderer2 in a service
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  _detectPrefersColorScheme() {
    // Detect if prefers-color-scheme is supported
    if (window.matchMedia('(prefers-color-scheme)').media !== 'not all') {
      // Set colorScheme to Dark if prefers-color-scheme is dark. Otherwise set to light.
      this.colorScheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      // If the browser doesn't support prefers-color-scheme, set it as default to dark
      this.colorScheme = 'dark';
    }
  }

  _setColorScheme(scheme: Scheme) {
    this.colorScheme = scheme;
    // Save prefers-color-scheme to localStorage
    localStorage.setItem('prefers-color', scheme);
  }

  _getColorScheme() {
    // Check if any prefers-color-scheme is stored in localStorage
    if (localStorage.getItem('prefers-color')) {
      // Save prefers-color-scheme from localStorage
      this.colorScheme = localStorage.getItem('prefers-color') as Scheme;
    } else {
      // If no prefers-color-scheme is stored in localStorage, try to detect OS default prefers-color-scheme
      this._detectPrefersColorScheme();
    }
  }

  /** initialise scheme system */
  load() {
    this._getColorScheme();
    if ( this.colorScheme === 'light' ) this.renderer.addClass(document.body, 'theme-alternate');
  }

  /** Update current scheme */
  update(scheme: Scheme) {
    this._setColorScheme(scheme);
    if ( scheme === 'dark' && document.body.classList.contains('theme-alternate') ) {
      // Remove the old color-scheme class
      this.renderer.removeClass( document.body, 'theme-alternate' );
    } else {
      // Add the new / current color-scheme class
      this.renderer.addClass(document.body, 'theme-alternate');
    }
  }

  /** Switch between the two schemes */
  toggle(): void {
    switch (this.colorScheme) {
      case 'dark': 
        this.update('light');
        break;
      case 'light':
        this.update('dark');
        break;
    }
  }

  /** retrieve the currently active scheme */
  currentActive() {
    return this.colorScheme;
  }

}

export type Scheme = 'dark'|'light';
