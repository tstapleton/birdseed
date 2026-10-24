import { Injectable } from '@angular/core';

/** Today's date. A service so tests can pin it. */
@Injectable({ providedIn: 'root' })
export class Clock {
  today(): Date {
    return new Date();
  }
}
