import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowUserIDDialog } from './show-user-id.dialog';

describe('ShowUserIDDialog', () => {
  let component: ShowUserIDDialog;
  let fixture: ComponentFixture<ShowUserIDDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ShowUserIDDialog ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowUserIDDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
