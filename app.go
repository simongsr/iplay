package main

import (
	"encoding/json"
	"errors"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type App struct {
	Router *mux.Router
	DB     *gorm.DB
}

var YOUTUBE_VIDEO_PATTERN = regexp.MustCompile("(.+?v=([\\w\\-]+).*|([\\w\\-]+))")

type controller func(r *http.Request) (interface{}, error)

func (a *App) Initialize() {
	db, err := gorm.Open(sqlite.Open("db.sqlite3"), &gorm.Config{})
	if err != nil {
		panic("failed to connect to database")
	}
	a.DB = db

	db.AutoMigrate(&Author{})
	db.AutoMigrate(&Video{})
	db.AutoMigrate(&Playlist{})

	firstPlaylist := Playlist{
		Name:     "your first playlist",
		Videos:   []Video{},
		Favorite: true,
	}
	firstPlaylist.Create(db)

	a.Router = mux.NewRouter()

	ytSubrouter := a.Router.PathPrefix("/api/playlists").Subrouter()
	ytSubrouter.HandleFunc("", serializeJSON(a.getPlaylists)).Methods("GET")
	ytSubrouter.HandleFunc("/{playlist-name}", serializeJSON(a.getPlaylist)).Methods("GET")
	ytSubrouter.HandleFunc("", serializeJSON(a.createPlaylists)).Methods("POST")
	ytSubrouter.HandleFunc("/{playlist-name}", serializeJSON(a.deletePlaylist)).Methods("DELETE")
	ytSubrouter.HandleFunc("/{playlist-name}/favorite", serializeJSON(a.setPlaylistFavorite)).Methods("PATCH")
	ytSubrouter.HandleFunc("/{playlist-name}/videos", serializeJSON(a.createVideo)).Methods("POST")
	ytSubrouter.HandleFunc("/{playlist-name}/videos/{video-id}", serializeJSON(a.addVideo)).Methods("PATCH")
	ytSubrouter.HandleFunc("/{playlist-name}/videos/{video-id}", serializeJSON(a.removeVideo)).Methods("DELETE")

	vSubrouter := a.Router.PathPrefix("/api/videos").Subrouter()
	vSubrouter.HandleFunc("", serializeJSON(a.getVideos)).Methods("GET")
	vSubrouter.HandleFunc("/{video-id}/disable", serializeJSON(a.disableVideo)).Methods("PATCH")
}

func (a *App) Run(addr string) {
	http.ListenAndServe(addr, handlers.CORS(
		handlers.AllowedHeaders([]string{
			"X-Requested-With",
			"Content-Type",
			"Authorization",
		}),
		handlers.AllowedMethods([]string{
			"GET",
			"POST",
			"PUT",
			"PATCH",
			"DELETE",
			"HEAD",
			"OPTIONS",
		}),
		handlers.AllowedOrigins([]string{"*"}))(a.Router))
}

func (a *App) getPlaylists(r *http.Request) (interface{}, error) {
	playlists, err := FindAllPlaylists(a.DB)
	if err != nil {
		return nil, err
	}
	return playlists, nil
}

func (a *App) getPlaylist(r *http.Request) (interface{}, error) {
	vars := mux.Vars(r)
	playlistName := strings.ToLower(vars["playlist-name"])
	playlist, err := FindOnePlaylistByName(playlistName, a.DB)
	if err != nil {
		return nil, err
	}
	return playlist, nil
}

func (a *App) createPlaylists(r *http.Request) (interface{}, error) {
	var playlist Playlist
	if err := json.NewDecoder(r.Body).Decode(&playlist); err != nil {
		return nil, err
	}
	playlist.Name = strings.ToLower(playlist.Name)
	playlist.Videos = []Video{}
	if err := playlist.Create(a.DB); err != nil {
		return nil, err
	}
	return playlist, nil
}

func (a *App) deletePlaylist(r *http.Request) (interface{}, error) {
	vars := mux.Vars(r)
	playlistName := strings.ToLower(vars["playlist-name"])
	err := DeleteOnePlaylistByName(playlistName, a.DB)
	if err != nil {
		return nil, err
	}
	return nil, nil
}

func (a *App) setPlaylistFavorite(r *http.Request) (interface{}, error) {
	vars := mux.Vars(r)
	playlistName := strings.ToLower(vars["playlist-name"])
	err := SetPlaylistAsFavoriteByName(playlistName, a.DB)
	if err != nil {
		return nil, err
	}
	return nil, nil
}

func (a *App) createVideo(r *http.Request) (interface{}, error) {
	vars := mux.Vars(r)
	playlistName := strings.ToLower(vars["playlist-name"])
	var video Video
	if err := json.NewDecoder(r.Body).Decode(&video); err != nil {
		return nil, err
	}
	video.Title = strings.ToLower(video.Title)
	video.Author.Name = strings.ToLower(video.Author.Name)
	video.Duration *= time.Duration(1000)
	video.Active = true
	groups := YOUTUBE_VIDEO_PATTERN.FindStringSubmatch(video.VideoID)
	if groups[2] != "" {
		video.VideoID = groups[2]
	} else if groups[1] != "" {
		video.VideoID = groups[1]
	} else {
		return nil, errors.New("no match found in URL: " + video.VideoID)
	}
	err := video.Create(playlistName, a.DB)
	if err != nil {
		return nil, err
	}
	return video, nil
}

func (a *App) addVideo(r *http.Request) (interface{}, error) {
	vars := mux.Vars(r)
	playlistName := strings.ToLower(vars["playlist-name"])
	videoID := vars["video-id"]
	playlist, err := FindOnePlaylistByName(playlistName, a.DB)
	if err != nil {
		return nil, err
	}
	video, err := FindOneVideoByVideoID(videoID, a.DB)
	if err != nil {
		return nil, err
	}
	if err = playlist.AddVideo(video, a.DB); err != nil {
		return nil, err
	}
	return video, nil
}

func (a *App) removeVideo(r *http.Request) (interface{}, error) {
	vars := mux.Vars(r)
	playlistName := strings.ToLower(vars["playlist-name"])
	videoID := vars["video-id"]
	playlist, err := FindOnePlaylistByName(playlistName, a.DB)
	if err != nil {
		return nil, err
	}
	video, err := FindOneVideoByVideoID(videoID, a.DB)
	if err != nil {
		return nil, err
	}
	err = playlist.RemoveVideo(video, a.DB)
	if err != nil {
		return nil, err
	}
	return nil, nil
}

func (a *App) getVideos(r *http.Request) (interface{}, error) {
	videoSelection, err := GetVideoSelection(a.DB)
	if err != nil {
		return nil, err
	}
	return videoSelection, nil
}

func (a *App) disableVideo(r *http.Request) (interface{}, error) {
	vars := mux.Vars(r)
	videoID := vars["video-id"]
	video, err := FindOneVideoByVideoID(videoID, a.DB)
	if err != nil {
		return nil, err
	}
	err = video.Disable(a.DB)
	if err != nil {
		return nil, err
	}
	return nil, nil
}

func serializeJSON(handler controller) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Content-Type", "application/json")
		response, err := handler(r)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(response)
		} else {
			json.NewEncoder(w).Encode(response)
		}
	}
}
