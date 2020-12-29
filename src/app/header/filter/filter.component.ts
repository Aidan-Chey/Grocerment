import { Component, OnInit, Output, EventEmitter, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss']
})
export class FilterComponent implements OnInit, OnDestroy {
  /** Outputs the filter field's current value */
  @Output() filter = new EventEmitter<string>();
  /** Reference to the filter input control */
  @ViewChild('filterInput') filterInputRef?: ElementRef<HTMLInputElement>;
  /** Boolean to control the filter field's visible state */
  public filterOpen = false;
  /** Control to hold the value of the filter field */
  public readonly filterControl = new FormControl();
  /** Emits when the component is destroyed */
  private readonly destruction$ = new Subject();
  constructor(
    private readonly iconRegistry: MatIconRegistry,
    private readonly sanitizer: DomSanitizer,
  ) {
    this.iconRegistry.addSvgIcon( 'search', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/magnifying-glass.svg') );
    this.iconRegistry.addSvgIcon( 'close', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/plus.svg') );
  }

  ngOnInit(): void {
    // Watches the filter control for changes, emitting the value
    this.filterControl.valueChanges.pipe(
      takeUntil(this.destruction$),
    ).subscribe( (data: string) => this.filter.emit(data) );

  }

  ngOnDestroy() {
    this.destruction$.next();
  }

  public openFilter(event: Event) {
    this.filterOpen = true;
    setTimeout( () => {
      if( !!this.filterInputRef ) this.filterInputRef.nativeElement.focus();
    }, 100 );
  }

  public onBlur() {
    if ( !!this.filterControl.value ) return;
    this.filterOpen = false;
  }

}
