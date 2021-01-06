import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

/** handles communication with the list filter component */

@Injectable({
  providedIn: 'root'
})
export class FilterService {

  private readonly _filter = new BehaviorSubject<string>('');
  public readonly filterTerm$ = this._filter.asObservable().pipe( shareReplay(1) );
  public get filterTerm() { return this._filter.getValue(); }
  public set filterTerm(term: string) { this._filter.next(term); }

  private readonly _filterable = new BehaviorSubject<boolean>(false);
  public filterable$ = this._filterable.asObservable().pipe( shareReplay(1) );
  public get filterable() { return this._filterable.getValue(); }
  public set filterable(bool: boolean) { this._filterable.next(bool); }

  constructor() { }
}
