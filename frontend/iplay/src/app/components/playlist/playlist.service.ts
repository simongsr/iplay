import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Playlist } from 'src/app/dto/playlist';
import { Video } from 'src/app/dto/video';

@Injectable({
  providedIn: 'root'
})
export class PlaylistService {

  playlistBaseUrl: string = "/api/playlists";

  constructor(private http: HttpClient) { }

  /*
   * Create a new playlist.
   * POST - http://localhost:8000/youtube/playlists
   */
  createPlaylist(baseUrl: string, playlistName: string) {
    return this.http.post(baseUrl + this.playlistBaseUrl, {
      name: playlistName,
      videos: [],
    });
  }

  /*
   * Delete a playlist.
   * DELETE - http://localhost:8000/youtube/playlists/<playlist_name>
   */
  deletePlaylist(baseUrl: string, playlistName: string) {
    return this.http.delete(baseUrl + this.playlistBaseUrl + "/" + playlistName);
  }

  setFavorite(baseUrl: string, playlist: Playlist) {
    return this.http.patch(baseUrl + this.playlistBaseUrl + "/" + playlist.name + "/favorite", playlist);
  }

  /*
   * Gets the list of all playlists without details.
   * GET - http://localhost:8000/youtube/playlists
   */
  getPlaylists(baseUrl: string) {
    return this.http.get(baseUrl + this.playlistBaseUrl);
  }

  /*
   * Gets a playlist with details.
   * GET - http://localhost:8000/youtube/playlists/<playlist_name>
   */
  getPlaylist(baseUrl: string, playlistName: string) {
    return this.http.get(baseUrl + this.playlistBaseUrl + "/" + playlistName);
  }

  /*
   * Create a new row for the video and adds it to the playlist.
   * POST - http://localhost:8000/youtube/playlists/<playlist_name>/videos
   */
  addNewVideo(baseUrl: string, playlistName: string, video: Video) {
    return this.http.post(baseUrl + this.playlistBaseUrl + "/" + playlistName + "/videos", video);
  }

  /*
   * Adds an existing video to the playlist.
   * PATCH - http://localhost:8000/youtube/playlists/<playlist_name>/videos/<video_id>
   */
  addVideo(baseUrl: string, playlistName: string, video: Video) {
    return this.http.patch(baseUrl + this.playlistBaseUrl + "/" + playlistName + "/videos/" + video.video_id, video);
  }

  /*
   * Removes the video from the playlist.
   * DELETE - http://localhost:8000/youtube/playlists/<playlist_name>/videos/<video_id>
   */
  removeVideo(baseUrl: string, playlistName: string, videoId: string) {
    return this.http.delete(baseUrl + this.playlistBaseUrl + "/" + playlistName + "/videos/" + videoId);
  }
}
