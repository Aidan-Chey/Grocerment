import { Pipe, PipeTransform } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Measurement } from './measurement.model';

@Pipe({
  name: 'getMeasurement'
})
export class GetMeasurementPipe implements PipeTransform {

  constructor(
    private readonly firestore: AngularFirestore,
  ) {}

  transform(value: string | null | undefined): Observable<Measurement | undefined> {
    if ( !value ) return of(undefined);

    return this.firestore.collection<Measurement>('measurements').doc(value).get().pipe(
      map( doc => {
        if ( !!doc && doc.exists ) return doc.data();
        else return undefined;
      }),
    );
  }

}
