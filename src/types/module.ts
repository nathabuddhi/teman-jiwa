export interface Module {
    id: string;
    title: string;
    description: string;
    content: string;
    image: string;
    quiz: {
        question: string;
        options: string[];
        answer: string;
    }[];
}
