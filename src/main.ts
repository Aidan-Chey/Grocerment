import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import * as Sentry from "@sentry/angular";
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

Sentry.init({
  dsn: "https://e4fecf9e0baa46c69fd9f1474d7e5e86@o509700.ingest.sentry.io/5604594",
});

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
