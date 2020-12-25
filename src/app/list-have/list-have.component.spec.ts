import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListHaveComponent } from './list-have.component';

describe('ListHaveComponent', () => {
  let component: ListHaveComponent;
  let fixture: ComponentFixture<ListHaveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListHaveComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListHaveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
