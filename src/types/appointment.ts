import type { Timestamp } from "firebase/firestore";

export interface Appointment {
    id: string;
    expert_id: string;
    user_id: string;
    status: string;
    start_time: Timestamp;
    finished_time: Timestamp;
    chats: Chat[];
}

export interface Chat {
    id: string;
    user_id: string;
    user_name: string;
    content: string;
    timestamp: Timestamp;
    type: "text" | "image" | "system";
}
