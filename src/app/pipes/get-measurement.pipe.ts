import { Pipe, PipeTransform } from '@angular/core';
import { AngularFirestore, DocumentReference } from '@angular/fire/firestore';
import { Observable, from, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Measurement } from '../models/measurement.model';

@Pipe({
  name: 'getMeasurement'
})
export class GetMeasurementPipe implements PipeTransform {

  constructor(
    private readonly firestore: AngularFirestore,
  ) {}

  transform(value: DocumentReference<Measurement>): Observable<Measurement | undefined> {
    if ( typeof(value) !== 'object' ) return of(undefined);

    return from(value.get()).pipe(
      map( doc => {
        if ( !!doc && doc.exists ) return doc.data();
        else return undefined;
      }),
    );
    
  }

}
