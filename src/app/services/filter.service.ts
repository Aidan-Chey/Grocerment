import { Injectable, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { filter, shareReplay, takeUntil } from 'rxjs/operators';

/** handles communication with the list filter component */

@Injectable({
  providedIn: 'root'
})
export class FilterService implements OnDestroy {

  private readonly destruction$ = new Subject();

  private readonly _filter = new BehaviorSubject<string>('');
  public readonly filterTerm$ = this._filter.asObservable().pipe( shareReplay(1) );
  public get filterTerm() { return this._filter.getValue(); }
  public set filterTerm(term: string) { this._filter.next(term); }

  private readonly _filterable = new BehaviorSubject<boolean>(false);
  public filterable$ = this._filterable.asObservable().pipe( shareReplay(1) );
  public get filterable() { return this._filterable.getValue(); }
  public set filterable(bool: boolean) { this._filterable.next(bool); }

  constructor( 
    private readonly router: Router,
  ) {
     // Watch navigation events, clearing the filter
     router.events.pipe(
      takeUntil(this.destruction$),
      filter( event => event instanceof NavigationEnd ),
    ).subscribe( event => {
      this.filterTerm = '';
    } );
  }

  ngOnDestroy() {
    this.destruction$.next();
  }

}
