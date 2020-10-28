import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDrawerContent } from '@angular/material/sidenav';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTable } from '@angular/material/table';
import { ImportExportDialogComponent } from './components/import-export-dialog/import-export-dialog/import-export-dialog.component';
import { NewPlaylistDialogComponent } from './components/new-playlist-dialog/new-playlist-dialog/new-playlist-dialog.component';
import { NewVideoDialogComponent } from './components/new-video-dialog/new-video-dialog/new-video-dialog.component';
import { PlayerComponent } from './components/player/player/player.component';
import { PlaylistService } from './components/playlist/playlist.service';
import { VideoListDialogComponent } from './components/video-list-dialog/video-list-dialog/video-list-dialog.component';
import { VideoService } from './components/video/video.service';
import { Playlist } from './dto/playlist';
import { Video } from './dto/video';
import { GenericCallback } from './interface/generic-callback';

export const BASE_URL: string = "http://localhost:8000";
const PAG_MAX_STEP: number = 10;
const SNACKBAR_DURATION: number = 2000; // ms
const SNACKBAR_TIMEOUT: number = SNACKBAR_DURATION + 200; // ms

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  title = 'iPlay';

  playlists: Array<Playlist> = [];
  playlist: Playlist = {
    name: '',
    videos: [],
    favorite: false,
  };

  selectedPlaylistIndex: number = -1;
  playingVideoIndex: number = -1;
  selectedVideoIndex: number = -1;

  displayedColumns: string[] = ["title", "author", "duration", "link", "delete", "disable"];

  @ViewChild("player")
  player: PlayerComponent;

  @ViewChild("videosTable")
  videosTable: MatTable<Video>;

  @ViewChild("drawerContent")
  drawerContent: MatDrawerContent;

  @ViewChild("playlistContainer")
  playlistContainer: ElementRef;

  videoMiniFabVisible: boolean = true;

  private dialogOpen: boolean = false;

  constructor(private playlistService: PlaylistService,
              private videoService: VideoService,
              private dialog: MatDialog,
              private snackBarFactory: MatSnackBar) {
    this.playlistService.getPlaylists(BASE_URL)
                        .subscribe((playlists: Array<Playlist>) => {
                          this.playlists = playlists;
                          if (playlists.length > 0) {
                            let favorites: Array<Playlist> = playlists.filter((value, index, array) => value.favorite);
                            let favoritePlaylist: Playlist = (favorites.length > 0) ? favorites[0] : playlists[0];
                            this.loadPlaylist(favoritePlaylist);
                            setTimeout(() => this.scrollPlaylist(), 500);
                          }
                        });
  }

  loadPlaylist(playlist: Playlist): void {
    if (playlist.name === this.playlist.name) {
      console.log("playlist '" + playlist.name + "' already loaded");
      return;
    }
    this.selectedPlaylistIndex = this.playlists.map((value, index, array) => value.name).indexOf(playlist.name);
    this.selectedVideoIndex = -1;
    this.playingVideoIndex = -1;
    this.playlistService.getPlaylist(BASE_URL, playlist.name)
                        .subscribe((playlist: Playlist) => {
                          console.debug("retrieved playlist: " + JSON.stringify(playlist));
                          playlist.videos = playlist.videos.filter((value, index, array) => value.active);
                          this.playlist = playlist;
                        });
  }

  setPlaylistFavorite(playlist: Playlist): void {
    this.playlistService.setFavorite(BASE_URL, playlist)
                        .subscribe(() => {
                          for (let i = 0; i < this.playlists.length; i++) {
                            this.playlists[i].favorite = false;
                          }
                          playlist.favorite = true;
                        });
  }

  playVideo(index: number = null): void {
    if (index === null) {
      this.playingVideoIndex = this.selectedVideoIndex;
    } else {
      this.selectVideo(index);
      this.playVideo();
    }
  }

  selectVideo(index: number): void {
    this.selectedVideoIndex = index;
  }

  openLink(videoId: string): void {
    window.open("https://www.youtube.com/watch?v=" + videoId, "_blank");
  }

  schedulePlaylistDeletion(playlistName: string): void {
    console.log("scheduling playlist removal: " + playlistName);
    let snackBar = this.snackBarFactory.open("Deleting playlist '" + playlistName + "'", "CANCEL", {
      duration: SNACKBAR_DURATION,
      horizontalPosition: "right",
    })
    let disablePlaylistTimer = setTimeout(() => {
      console.log("removing playlist: " + playlistName);
      this.playlistService.deletePlaylist(BASE_URL, playlistName)
                          .subscribe(() => this.deletePlaylistFromList(playlistName));
    }, SNACKBAR_TIMEOUT);
    snackBar.onAction().subscribe(() => {
      console.log("removin of playlist '" + playlistName + "' was canceled");
      clearTimeout(disablePlaylistTimer);
    });
  }

  scheduleVideoRemoval(video: string | Video): void {
    if (typeof video === 'string') {
      video = this.playlist.videos.filter((value, index, array) => value.video_id === video)[0];
    }
    const title = this.toTitleCase(video.title);
    const author = this.toTitleCase(video.author.name);
    let snackBar = this.snackBarFactory.open('Removing ' + title + ' by ' + author, 'CANCEL', {
      duration: SNACKBAR_DURATION,
      horizontalPosition: 'right',
    })
    let removeVideoTimer = setTimeout(() => {
      this.playlistService.removeVideo(BASE_URL, this.playlist.name, (<Video> video).video_id)
                          .subscribe(() => this.deleteVideoFromPlaylist((<Video> video).video_id));
    }, SNACKBAR_TIMEOUT);
    snackBar.onAction().subscribe(() => clearTimeout(removeVideoTimer));
  }

  scheduleVideoDisabling(videoId: string): void {
    let video = this.playlist.videos.filter((value, index, array) => value.video_id === videoId)[0];
    const title = this.toTitleCase(video.title);
    const author = this.toTitleCase(video.author.name);
    let snackBar = this.snackBarFactory.open('Disabling ' + title + ' by ' + author, 'CANCEL', {
      duration: SNACKBAR_DURATION,
      horizontalPosition: 'right',
    })
    let disableVideoTimer = setTimeout(() => this.disableVideo(video.video_id), SNACKBAR_TIMEOUT);
    snackBar.onAction().subscribe(() => clearTimeout(disableVideoTimer));
  }

  openNewPlaylistDialog(): void {
    console.log("opening new playlist dialog");
    const dialogRef = this.dialog.open(NewPlaylistDialogComponent, {
      width: "250px",
      data: "",
    });
    this.dialogOpen = true;
    dialogRef.afterClosed().subscribe((playlistName: string) => {
      this.dialogOpen = false;
      if (playlistName == null) {
        return;
      }
      this.newPlaylist({
        name: playlistName,
        videos: [],
        favorite: false,
      });
    });
  }

  openNewVideoDialog(): void {
    console.log("opening new video dialog")
    const dialogRef = this.dialog.open(NewVideoDialogComponent, {
      width: "50%",
      data: {
        video_id: "",
        title: "",
        duration: 0,
        author: {
          name: ""
        },
      },
    });
    this.dialogOpen = true;
    dialogRef.afterClosed().subscribe((video: Video) => {
      this.dialogOpen = false;
      if (video == null) {
        return;
      }
      this.newVideo(video, this.playlist);
    });
  }

  openVideoListDialog(): void {
    console.log("opening video list dialog")
    const dialogRef = this.dialog.open(VideoListDialogComponent, {
      width: "80%",
    });
    dialogRef.componentInstance.appComponent = this;
    this.dialogOpen = true;
    dialogRef.afterClosed().subscribe((videos: Array<Video>) => {
      this.dialogOpen = false;
      if (videos == null) {
        return;
      }
    });
  }

  // openImportExportDialog(): void {
  //   console.info("opening import/export dialog");
  //   const dialogRef = this.dialog.open(ImportExportDialogComponent, {
  //     width: "40%",
  //   });
  //   dialogRef.componentInstance.appComponent = this;
  //   this.dialogOpen = true;
  //   dialogRef.afterClosed().subscribe((videos: Array<Video>) => {
  //     this.dialogOpen = false;
  //     if (videos == null) {
  //       return;
  //     }
  //   });
  // }

  toggleVideoMiniFabVisibility(): void {
    this.videoMiniFabVisible = !this.videoMiniFabVisible;
  }

  appendVideo(video: Video, playlist?: Playlist): void {
    if (playlist == null) {
      playlist = this.playlist;
    }
    playlist.videos.push(video);
    this.videosTable.renderRows();
  }

  newVideo(video: Video, playlist: Playlist): void {
    console.log("saving new video in '" + playlist.name + "': " + JSON.stringify(video));
    this.playlistService.addNewVideo(BASE_URL, playlist.name, video)
                        .subscribe((newVideo: Video) => {
                          console.log("new video saved in '" + playlist.name + "': " + JSON.stringify(newVideo));
                          this.appendVideo(newVideo, playlist);
                        });
  }

  newPlaylist(playlist: Playlist, callback?: GenericCallback): void {
    console.log("creating new playlist: " + playlist.name);
      this.playlistService.createPlaylist(BASE_URL, playlist.name)
                          .subscribe((playlist: Playlist) => {
                            console.log("playlist created: " + playlist.name);
                            const selectedPlaylistName = this.playlists[this.selectedPlaylistIndex];
                            let index = 0;
                            while (index < this.playlists.length && playlist.name.localeCompare(this.playlists[index].name) > 0) {
                              index++;
                            }
                            this.playlists.splice(index, 0, playlist);
                            setTimeout(() => this.selectedPlaylistIndex = this.playlists.indexOf(selectedPlaylistName), 50);
                            if (callback !== null) {
                              callback(playlist);
                            }
                          });
  }

  onVideoEnded(ended: boolean): void {
    if (ended) {
      if (this.selectNextVideo()) {
        this.playVideo();
      }
    }
  }

  @HostListener('window:keyup', ['$event'])
  keyUpEvent(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') {
      if (this.player != null && !this.dialogOpen) {
        this.player.bkwd();
      }
    } else if (event.key === 'ArrowRight') {
      if (this.player != null && !this.dialogOpen) {
        this.player.ffwd();
      }
    } else if (event.key === ' ') { // Space
      event.stopImmediatePropagation();
      if (this.player != null && !this.dialogOpen) {
        this.player.togglePause();
      }
    } else if (event.key === 'Enter' && !this.dialogOpen) {
      console.log('on key up: enter');
      if (this.selectedVideoIndex < 0) {
        console.log('no video was selected yet, playing the first found in the playlist: ' + JSON.stringify(this.playlist.videos[0]));
        this.playVideo(0);
      } else if (this.selectedVideoIndex == this.playingVideoIndex) {
        if (this.player != null) {
          console.log('restarting video: ' + JSON.stringify(this.playlist.videos[this.playingVideoIndex]));
          this.player.restart();
        }
      } else {
        console.log('playing selected video: ' + JSON.stringify(this.playlist.videos[this.selectedVideoIndex]));
        this.playVideo();
      }
    } else if (event.key === 'Home' && !this.dialogOpen) {
      this.selectedVideoIndex = 0;
      this.scrollVideo();
    } else if (event.key === 'End' && !this.dialogOpen) {
      this.selectedVideoIndex = this.playlist.videos.length - 1;
      this.scrollVideo();
    } else if (event.altKey && event.key === 's' && !this.dialogOpen) { // SEARCH
      console.log('SEARCH'); // TODO
    } else if (event.altKey && event.key === 'n' && !this.dialogOpen) { // NEW VIDEO
      this.openNewVideoDialog();
    } else if (event.altKey && event.key === 'a' && !this.dialogOpen) { // ADD VIDEO TO PLAYLIST
      this.openVideoListDialog();
    } else if (event.altKey && event.key === 'b' && !this.dialogOpen) { // BACK TO BEGIN / RESTART
      if (this.player != null) {
        this.player.restart();
      }
    } else if (event.altKey && event.key === 'Delete' && !this.dialogOpen) { // DELETE
      this.scheduleVideoRemoval(this.playlist.videos[this.selectedVideoIndex]);
    }
  }

  @HostListener('window:keydown', ['$event'])
  keyDownEvent(event: KeyboardEvent) {
    if (event.key === 'ArrowUp' && !this.dialogOpen) {
      event.stopImmediatePropagation();
      if (event.altKey) {
        this.selectPrevVideo();
        this.playVideo();
      } else {
        this.selectPrevVideo();
      }
    } else if (event.key === 'ArrowDown' && !this.dialogOpen) {
      event.stopImmediatePropagation();
      if (event.altKey) {
        this.selectNextVideo();
        this.playVideo();
      } else {
        this.selectNextVideo();
      }
    } else if (event.key === 'PageDown' && !this.dialogOpen) {
      event.stopImmediatePropagation();
      this.selectNextVideo(PAG_MAX_STEP);
    } else if (event.key === 'PageUp' && !this.dialogOpen) {
      event.stopImmediatePropagation();
      this.selectPrevVideo(PAG_MAX_STEP);
    }
  }

  private selectNextVideo(step: number = 1): boolean {
    if (this.selectedVideoIndex < this.playlist.videos.length - 1) {
      const diff = this.playlist.videos.length - 1 - this.selectedVideoIndex;
      step = (diff >= step) ? step : diff;
      this.selectedVideoIndex += step;
      this.scrollVideo();
      return true;
    }
    return false;
  }

  private selectPrevVideo(step: number = 1): boolean {
    if (this.selectedVideoIndex > 0) {
      step = (this.selectedVideoIndex >= step) ? step : this.selectedVideoIndex;
      this.selectedVideoIndex -= step;
      this.scrollVideo();
      return true;
    }
    return false;
  }

  private scrollVideo(): void {
    const TOOLBAR_HEIGHT: number = 64;
    const TABLE_HEADER_HEIGHT: number = 40;
    const TABLE_ROW_HEIGHT: number = 40;
    const viewTop: number = this.drawerContent.measureScrollOffset("top");
    const viewHeight: number = window.innerHeight - TOOLBAR_HEIGHT - TABLE_HEADER_HEIGHT;
    const rowTop: number = this.selectedVideoIndex * TABLE_ROW_HEIGHT;
    const rowBottom: number = rowTop + TABLE_ROW_HEIGHT;
    if (rowTop >= viewTop && rowBottom <= viewHeight + viewTop) {
      return;
    } else if (rowTop < viewTop) {
      // row on top of view
      this.drawerContent.scrollTo({top: rowTop});
    } else if (rowBottom > viewTop + viewHeight) {
      // row in the bottom of view
      this.drawerContent.scrollTo({top: rowBottom - viewHeight});
    }
  }

  private scrollPlaylist(): void {
    const TOOLBAR_HEIGHT: number = 64;
    const VIDEO_PLAYER_HEIGHT: number = 250;
    const LIST_VERTICAL_PADDING: number = 8;
    const LIST_ITEM_HEIGHT: number = 48;
    const viewHeight: number = window.innerHeight - TOOLBAR_HEIGHT - VIDEO_PLAYER_HEIGHT;
    const itemTop: number = this.selectedPlaylistIndex * LIST_ITEM_HEIGHT;
    const itemBottom: number = itemTop + LIST_ITEM_HEIGHT;
    if (itemBottom > viewHeight) {
      const itemsVisibleInView: number = viewHeight / LIST_ITEM_HEIGHT;
      const nextItemsCount: number = this.playlists.length - 1 - this.selectedPlaylistIndex;
      const optionalScroll: number = ((nextItemsCount > itemsVisibleInView / 2) ? (itemsVisibleInView / 2) : nextItemsCount) * LIST_ITEM_HEIGHT;
      const availableScroll: number = this.playlists.length * LIST_ITEM_HEIGHT + LIST_VERTICAL_PADDING - viewHeight; // scroll 'till the last item is visible
      const scroll: number = availableScroll - (this.playlists.length - 1 - this.selectedPlaylistIndex) * LIST_ITEM_HEIGHT + optionalScroll; // makes the favorite item the one which is in the visible middle
      this.playlistContainer.nativeElement.scrollTop = scroll;
    }
  }

  private disableVideo(videoId: string): void {
    const video = this.playlist.videos.filter((value, index, array) => value.video_id === videoId)[0];
    this.videoService.disableVideo(BASE_URL, video)
                      .subscribe(() => this.deleteVideoFromPlaylist(videoId));
  }

  private deletePlaylistFromList(playlistName: string): void {
    console.log("Removing playlist '" + playlistName + "' from list");
    let aux = this.playlists.filter((value, index, array) => value.name !== playlistName);
    this.playlists = aux;
    if (this.selectedPlaylistIndex >= this.playlists.length) {
      this.selectedPlaylistIndex--;
    }
    if (this.playlists[this.selectedPlaylistIndex].name != this.playlist.name) {
      this.loadPlaylist(this.playlists[this.selectedPlaylistIndex]);
    }
  }

  private deleteVideoFromPlaylist(videoId: string): void {
    let aux = this.playlist.videos.filter((value, index, array) => value.video_id !== videoId);
    this.playlist.videos = aux;
    if (this.selectedVideoIndex >= this.playlist.videos.length) {
      this.selectedVideoIndex--;
    }
  }

  private toTitleCase(s: string): string {
    return s.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  }
}
