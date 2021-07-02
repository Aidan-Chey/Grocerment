import { Component, OnInit } from '@angular/core';
import { RecipiesService } from '@grocerment-app/recipies.service';
import { shareReplay } from 'rxjs/operators';

@Component({
  selector: 'app-recipies',
  templateUrl: './recipies.component.html',
  styleUrls: ['./recipies.component.scss']
})
export class RecipiesComponent implements OnInit {

  public readonly recipies$ = this.recipiesService.getRecipies().pipe(
    shareReplay(1),
  );

  constructor(
    private readonly recipiesService: RecipiesService,
  ) { }

  ngOnInit(): void {
  }

}
