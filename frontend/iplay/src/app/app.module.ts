import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

import { YouTubePlayerModule } from '@angular/youtube-player';

import { PlayerComponent } from './components/player/player/player.component';
import { StopPropagationDirective } from './components/stop-propagation/stop-propagation.directive';
import { NewPlaylistDialogComponent } from './components/new-playlist-dialog/new-playlist-dialog/new-playlist-dialog.component';
import { NewVideoDialogComponent } from './components/new-video-dialog/new-video-dialog/new-video-dialog.component';
import { VideoListDialogComponent } from './components/video-list-dialog/video-list-dialog/video-list-dialog.component';
import { ImportExportDialogComponent } from './components/import-export-dialog/import-export-dialog/import-export-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    PlayerComponent,
    StopPropagationDirective,
    NewPlaylistDialogComponent,
    NewVideoDialogComponent,
    VideoListDialogComponent,
    ImportExportDialogComponent
  ],
  imports: [
    FormsModule,
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    MatTableModule,
    MatSnackBarModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatMenuModule,
    MatDividerModule,
    YouTubePlayerModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
