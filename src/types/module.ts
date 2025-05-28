import type { Timestamp } from "firebase/firestore";

export interface Module {
    id: string;
    author_id: string;
    title: string;
    description: string;
    content: string;
    image_url: string;
    last_modified: Timestamp;
    quiz: {
        question: string;
        options: string[];
        answer: string;
    }[];
}
