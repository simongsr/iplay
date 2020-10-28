import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { YouTubePlayer } from '@angular/youtube-player';
import { Video } from 'src/app/dto/video';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss']
})
export class PlayerComponent implements OnInit {

  private _video: Video;
  private _isVideoPaused: boolean = true;

  @ViewChild('player')
  player: YouTubePlayer;

  @Output()
  ended: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor(private titleService: Title) { }

  @Input()
  set video(aux: Video) {
    this._video = aux;
    setTimeout(() => this.play(), 100);
  }

  get video(): Video {
    return this._video;
  }

  ngOnInit(): void {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(tag);
  }

  play(): void {
    this.player.playVideo();
    this._isVideoPaused = false;
    const title: string = this.toTitleCase(this.video.title);
    const author: string = this.toTitleCase(this.video.author.name);
    this.titleService.setTitle("iPlay - " + title + " by " + author);
  }

  togglePause(): void {
    if (this._isVideoPaused) {
      this.play();
    } else {
      this.player.pauseVideo();
      this._isVideoPaused = true;
      this.titleService.setTitle("iPlay");
    }
  }

  ffwd(): void {
    let nextTime = this.player.getCurrentTime() + 10;
    this.player.seekTo(nextTime, true);
  }

  bkwd(): void {
    let prevTime = this.player.getCurrentTime() - 10;
    this.player.seekTo(prevTime, true);
  }

  restart(): void {
    this.player.seekTo(0, true);
  }

  onStateChange(event: any): void {
    if (event.data === YT.PlayerState.ENDED) {
      this.ended.emit(true);
    }
  }

  private toTitleCase(s: string): string {
    return s.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  }
}
