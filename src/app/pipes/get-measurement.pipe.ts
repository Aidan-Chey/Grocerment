import { Pipe, PipeTransform } from '@angular/core';
import { DocumentReference } from '@angular/fire/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, from, of, EMPTY } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '@grocerment-environment';
import { Measurement } from '@grocerment-models/measurement.model';
import * as Sentry from "@sentry/angular";

@Pipe({
  name: 'getMeasurement'
})
export class GetMeasurementPipe implements PipeTransform {

  constructor(
    private readonly snackbar: MatSnackBar,
  ) {}

  transform(value: DocumentReference<Measurement> | undefined | null): Observable<Measurement | undefined> {
    if (!value || typeof(value) !== 'object' ) return of(undefined);

    return from(value.get()).pipe(
      catchError( err => {
        const issue = 'Failed to retrieve measurement';
        if ( environment.production ) Sentry.captureException(err);
        else console.error(issue + ' |', err);
        this.snackbar.open( issue, 'Dismiss', { duration: 3000, verticalPosition: 'bottom' } );
        return EMPTY;
      } ),
      map( doc => {
        if ( !!doc && doc.exists ) return doc.data();
        else return undefined;
      }),
    );
    
  }

}
