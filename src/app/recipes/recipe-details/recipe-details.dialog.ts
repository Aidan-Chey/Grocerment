import { Component, OnInit, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RecipeDetails } from '../spoonacular-api.service';

@Component({
  templateUrl: './recipe-details.dialog.html',
  styleUrls: ['./recipe-details.dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecipeDetailsDialog implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<RecipeDetailsDialog>,
    @Inject(MAT_DIALOG_DATA) public data: RecipeDetails,
  ) { }

  ngOnInit(): void {
  }

  goToRecipe( url: string ): void {
    window.open(url);
  }

}
