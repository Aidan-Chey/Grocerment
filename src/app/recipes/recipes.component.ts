import { Component, OnInit } from '@angular/core';
import { RecipesService } from '@grocerment-recipes/recipes.service';
import { shareReplay } from 'rxjs/operators';

@Component({
  selector: 'app-recipes',
  templateUrl: './recipes.component.html',
  styleUrls: ['./recipes.component.scss']
})
export class RecipesComponent implements OnInit {

  public readonly recipes$ = this.RecipesService.getRecipes().pipe(
    shareReplay(1),
  );

  constructor(
    public readonly RecipesService: RecipesService,
  ) { }

  ngOnInit(): void {
  }

  

}
