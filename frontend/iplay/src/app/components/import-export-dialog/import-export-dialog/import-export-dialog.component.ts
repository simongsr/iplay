import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AppComponent } from 'src/app/app.component';
import { Playlist } from 'src/app/dto/playlist';
import { Video } from 'src/app/dto/video';

@Component({
  selector: 'app-import-export-dialog',
  templateUrl: './import-export-dialog.component.html',
  styleUrls: ['./import-export-dialog.component.scss']
})
export class ImportExportDialogComponent implements OnInit {

  appComponent: AppComponent;

  @ViewChild("fileInput")
  fileInput: ElementRef;

  constructor(public dialogRef: MatDialogRef<ImportExportDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit(): void {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onFileSelected() {
    if (typeof(FileReader) !== "undefined") {
      const reader = new FileReader();
      reader.onload = (ev: ProgressEvent<FileReader>) => {
        const playlist: Playlist = <Playlist> JSON.parse(<string> ev.target.result);
        const videos: Array<Video> = playlist.videos;
        playlist.videos = [];
        this.appComponent.newPlaylist(playlist, (playlist: any) => {
          videos.forEach((video, index, array) => this.appComponent.newVideo(video, playlist));
        });
      };
      reader.readAsText(this.fileInput.nativeElement.files[0], "utf-8");
    }
  }
}
