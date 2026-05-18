import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckInComponent } from './check-in.component';

describe('CheckInComponent', () => {
  let component: CheckInComponent;
  let fixture: ComponentFixture<CheckInComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckInComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CheckInComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
