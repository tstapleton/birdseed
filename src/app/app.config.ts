import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { Transport } from './core/api/transport';
import { MockTransport } from './core/mock-backend/mock-transport';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    // No server: the demo answers API requests from data kept in localStorage.
    { provide: Transport, useClass: MockTransport },
  ],
};
