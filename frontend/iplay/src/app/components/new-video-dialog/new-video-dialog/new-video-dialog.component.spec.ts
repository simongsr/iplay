import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewVideoDialogComponent } from './new-video-dialog.component';

describe('NewVideoDialogComponent', () => {
  let component: NewVideoDialogComponent;
  let fixture: ComponentFixture<NewVideoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewVideoDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewVideoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
