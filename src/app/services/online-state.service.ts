import { Injectable } from '@angular/core';
import { fromEvent, merge } from 'rxjs';
import { map, shareReplay, startWith, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class OnlineStateService {

  public readonly appOnline$ = merge(
    fromEvent(window, 'offline').pipe(map(() => false)),
    fromEvent(window, 'online').pipe(map(() => true)),
  ).pipe(
    startWith( navigator.onLine ),
    shareReplay(1),
  );

  constructor() { }
}
