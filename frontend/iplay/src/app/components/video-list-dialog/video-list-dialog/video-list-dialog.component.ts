import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTable } from '@angular/material/table';
import { AppComponent, BASE_URL } from 'src/app/app.component';
import { Video } from 'src/app/dto/video';
import { PlaylistService } from '../../playlist/playlist.service';
import { VideoService } from '../../video/video.service';

@Component({
  selector: 'app-video-list-dialog',
  templateUrl: './video-list-dialog.component.html',
  styleUrls: ['./video-list-dialog.component.scss']
})
export class VideoListDialogComponent implements OnInit {

  @Inject(MAT_DIALOG_DATA)
  videos: Array<SelectingVideo> = [];

  @ViewChild("selectingVideosTable")
  videosTable: MatTable<SelectingVideo>;

  displayedColumns: string[] = ['title', 'author', 'duration', 'link', 'add'];

  appComponent: AppComponent;

  constructor(private videoService: VideoService,
              private playlistService: PlaylistService,
              public dialogRef: MatDialogRef<VideoListDialogComponent>) { }

  ngOnInit(): void {
    this.videoService.getVideos(BASE_URL)
                      .subscribe((videos: Array<SelectingVideo>) => {
                        videos.forEach((value) => {
                          value.selected = value.playlist_name === this.appComponent.playlist.name;
                          value.author = { name: value.author_name };
                        });
                        this.videos = videos;
                        this.videosTable.renderRows();
                      });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  addVideo(video: SelectingVideo) {
    this.playlistService.addVideo(BASE_URL, this.appComponent.playlist.name, video)
                        .subscribe(() => {
                          video.selected = true;
                          this.appComponent.appendVideo(video);
                        });
  }
}

interface SelectingVideo extends Video {
  selected: boolean;
  playlist_name: string;
  author_name: string;
}
