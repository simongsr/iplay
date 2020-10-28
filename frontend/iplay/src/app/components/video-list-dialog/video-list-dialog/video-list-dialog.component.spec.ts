import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoListDialogComponent } from './video-list-dialog.component';

describe('VideoListDialogComponent', () => {
  let component: VideoListDialogComponent;
  let fixture: ComponentFixture<VideoListDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VideoListDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VideoListDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
