import type { Timestamp } from "firebase/firestore";

export interface Forum {
    id: string;
    user_id: string;
    title: string;
    content: string;
    image_url: string[];
    timestamp: Timestamp;
    comments: Comment[];
    likes: string[];
}

export interface Comment {
    id: string;
    user_id: string;
    content: string;
    timestamp: Timestamp;
    comments: Comment[];
}
