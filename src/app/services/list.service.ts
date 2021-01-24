import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { List } from '../models/list.model';

@Injectable({
  providedIn: 'root'
})
export class ListService {

  public readonly activeListSubject = new BehaviorSubject<List | undefined>(undefined);

  constructor() { }
}
