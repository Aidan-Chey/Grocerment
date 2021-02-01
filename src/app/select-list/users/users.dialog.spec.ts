import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsersDialog } from './users.dialog';

describe('UsersDialog', () => {
  let component: UsersDialog;
  let fixture: ComponentFixture<UsersDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UsersDialog ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UsersDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
