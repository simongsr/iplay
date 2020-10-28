import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Video } from 'src/app/dto/video';

@Component({
  selector: 'app-new-video-dialog',
  templateUrl: './new-video-dialog.component.html',
  styleUrls: ['./new-video-dialog.component.scss']
})
export class NewVideoDialogComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<NewVideoDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: Video) { }

  ngOnInit(): void {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
