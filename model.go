package main

import (
	"time"

	"gorm.io/gorm"
)

type Author struct {
	gorm.Model
	Name string `gorm:"unique;uniqueIndex" json:"name"`
}

type Video struct {
	gorm.Model
	VideoID     string `gorm:"unique;uniqueIndex" json:"video_id"`
	Title       string `json:"title"`
	AuthorRefer int
	Author      Author        `gorm:"foreignKey:AuthorRefer;constraint:OnDelete:CASCADE" json:"author"`
	Duration    time.Duration `json:"duration"`
	Active      bool          `json:"active"`
}

type Playlist struct {
	gorm.Model
	Name     string  `gorm:"unique;uniqueIndex" json:"name"`
	Videos   []Video `gorm:"many2many:join_videos_playlists;" json:"videos"`
	Favorite bool    `json:"favorite"`
}

type VideoSelection struct {
	VideoID  string        `json:"video_id"`
	Title    string        `json:"title"`
	Author   string        `json:"author_name"`
	Duration time.Duration `json:"duration"`
	Playlist string        `json:"playlist_name"`
}

func FindAllPlaylists(db *gorm.DB) ([]*Playlist, error) {
	var playlists []*Playlist
	if err := db.Order("name asc").Find(&playlists).Error; err != nil {
		return nil, err
	}
	return playlists, nil
}

func FindOnePlaylistByName(playlistName string, db *gorm.DB) (*Playlist, error) {
	var playlist Playlist
	if err := db.Preload("Videos").Preload("Videos.Author").Where("name = ?", playlistName).First(&playlist).Error; err != nil {
		return nil, err
	}
	return &playlist, nil
}

func DeleteOnePlaylistByName(playlistName string, db *gorm.DB) error {
	if err := db.Where("name = ?", playlistName).Unscoped().Delete(&Playlist{}).Error; err != nil {
		return err
	}
	return nil
}

func SetPlaylistAsFavoriteByName(playlistName string, db *gorm.DB) error {
	if err := db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&Playlist{}).Where("favorite = ?", 1).Update("favorite", false).Error; err != nil {
			return err
		}
		if err := tx.Model(&Playlist{}).Where("name = ?", playlistName).Update("favorite", true).Error; err != nil {
			return err
		}
		return nil
	}); err != nil {
		return err
	}
	return nil
}

func (p *Playlist) Create(db *gorm.DB) error {
	if err := db.FirstOrCreate(p, *p).Error; err != nil {
		return err
	}
	return nil
}

func (p *Playlist) AddVideo(video *Video, db *gorm.DB) error {
	if err := db.Model(p).Association("Videos").Append(video); err != nil {
		return err
	}
	return nil
}

func (p *Playlist) RemoveVideo(video *Video, db *gorm.DB) error {
	if err := db.Model(p).Association("Videos").Delete(video); err != nil {
		return err
	}
	return nil
}

func FindOneVideoByVideoID(videoID string, db *gorm.DB) (*Video, error) {
	var video Video
	if err := db.Preload("Author").Where("video_id = ?", videoID).First(&video).Error; err != nil {
		return nil, err
	}
	return &video, nil
}

func (v *Video) Create(playlistName string, db *gorm.DB) error {
	if err := db.Transaction(func(tx *gorm.DB) error {
		if err := v.Author.Create(tx); err != nil {
			return err
		}
		if err := tx.Create(v).Error; err != nil {
			return err
		}
		playlist, err := FindOnePlaylistByName(playlistName, tx)
		if err != nil {
			return err
		}
		if err = playlist.AddVideo(v, tx); err != nil {
			return err
		}
		return nil
	}); err != nil {
		return err
	}
	return nil
}

func (v *Video) Disable(db *gorm.DB) error {
	if err := db.Model(v).Update("active", 0).Error; err != nil {
		return err
	}
	return nil
}

func (a *Author) Create(db *gorm.DB) error {
	if err := db.FirstOrCreate(a, *a).Error; err != nil {
		return err
	}
	return nil
}

func GetVideoSelection(db *gorm.DB) ([]VideoSelection, error) {
	var videoSelection []VideoSelection
	if err := db.Order("author asc, title asc").Table(
		"videos",
	).Select(
		"videos.video_id, videos.title, authors.name as author, videos.duration, playlists.name as playlist",
	).Joins(
		"LEFT JOIN join_videos_playlists jvp ON jvp.video_id = videos.id",
	).Joins(
		"LEFT JOIN authors ON videos.author_refer = authors.id",
	).Joins(
		"LEFT JOIN playlists ON jvp.playlist_id = playlists.id",
	).Where(
		"videos.active = 1",
	).Scan(&videoSelection).Error; err != nil {
		return nil, err
	}
	return videoSelection, nil
}
