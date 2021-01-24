import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { MatDialogRef } from '@angular/material/dialog';
import { map, shareReplay, withLatestFrom } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { List } from '../models/list.model';
import { ListService } from '../services/list.service';
import { MatSelectionList } from '@angular/material/list';
import { AngularFireAuth } from '@angular/fire/auth';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

export const selectListConfig = {
	minWidth: '5em',
	width: '95vw',
  maxWidth: '50em',
  maxHeight: '95vh',
};

@Component({
  selector: 'app-select-list',
  templateUrl: './select-list.component.html',
  styleUrls: ['./select-list.component.scss']
})
export class SelectListComponent implements OnInit, AfterViewInit {

  @ViewChild('listsList') listsList?: MatSelectionList;

  public readonly lists$ = this.firestore.collection<List>('lists').valueChanges({idField: 'id'}).pipe(
    shareReplay(1),
  );

  public readonly listsOptions$ = combineLatest([
    this.lists$,
    this.listService.activeListSubject.asObservable(),
  ]).pipe(
    map( ([lists, activeList]) => Array.isArray(lists) ? lists.reduce( (acc,cur) => {
      // Don't include currently active list in selction
      if ( !!activeList?.id && activeList.id !== cur.id ) acc.push( { name: cur.name, id: cur.id, users: cur.users?.length } );
      return acc;
    }, [] as { name: string, id: string | null, users: number | undefined }[] ) : undefined ),
    withLatestFrom(this.afAuth.user),
    map( ([lists,user]) => {
      if ( !!user ) lists?.unshift({ name: 'Default', users: 1, id: null });
      return lists;
    } ),
    shareReplay(1),
  );

  constructor(
    private readonly iconRegistry: MatIconRegistry,
    private readonly sanitizer: DomSanitizer,
    private readonly firestore: AngularFirestore,
    private readonly afAuth: AngularFireAuth,
    private readonly listService: ListService,
    public readonly dialogRef: MatDialogRef<SelectListComponent>,
  ) {
    this.iconRegistry.addSvgIcon( 'cancel', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/plus.svg') );
  }

  ngOnInit(): void {
  }

  ngAfterViewInit() {

  }

}
