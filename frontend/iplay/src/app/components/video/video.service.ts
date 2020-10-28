import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Video } from 'src/app/dto/video';

@Injectable({
  providedIn: 'root'
})
export class VideoService {

  videoBaseUrl: string = "/api/videos";

  constructor(private http: HttpClient) { }

  disableVideo(baseUrl: string, video: Video) {
    video.active = false;
    return this.http.patch(baseUrl + this.videoBaseUrl + "/" + video.video_id + "/disable", video);
  }

  getVideos(baseUrl: string) {
    return this.http.get(baseUrl + this.videoBaseUrl);
  }
}
