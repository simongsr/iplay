import { Video } from './video';

export interface Playlist {
    name: string;
    videos: Array<Video>;
    favorite: boolean;
}
