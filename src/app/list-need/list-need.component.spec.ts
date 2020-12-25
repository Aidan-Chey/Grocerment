import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListNeedComponent } from './list-need.component';

describe('ListNeedComponent', () => {
  let component: ListNeedComponent;
  let fixture: ComponentFixture<ListNeedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListNeedComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListNeedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
