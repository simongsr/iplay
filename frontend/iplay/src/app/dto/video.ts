import { Author } from './author';

export interface Video {
    video_id: string;
    title: string;
    duration: number;
    active: boolean;
    created: Date;
    author: Author;
}
