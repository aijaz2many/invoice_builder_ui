import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminSubscriptions } from './admin-subscriptions';

describe('AdminSubscriptions', () => {
  let component: AdminSubscriptions;
  let fixture: ComponentFixture<AdminSubscriptions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminSubscriptions]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminSubscriptions);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
