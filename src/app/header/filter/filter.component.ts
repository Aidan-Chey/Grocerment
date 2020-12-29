import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss']
})
export class FilterComponent implements OnInit {
  /** Outputs the filter field's current value */
  @Output() filter = new EventEmitter<string>();
  /** Boolean to control the filter field's visible state */
  public filterOpen = true;
  /** Control to hold the value of the filter field */
  public readonly filterControl = new FormControl();
  /** Emits when the component is destroyed */
  private readonly destruction$ = new Subject();

  constructor(
    private readonly iconRegistry: MatIconRegistry,
    private readonly sanitizer: DomSanitizer,
  ) {
    this.iconRegistry.addSvgIcon( 'search', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/magnifying-glass.svg') );
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

}
