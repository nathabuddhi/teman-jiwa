import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { firestore as db } from "@/lib/firebase";
import type { Module } from "@/types/module";

export default function ModuleDetailPage() {
    const { id } = useParams();
    const [mod, setMod] = useState<Module | null>(null);
    const [authorName, setAuthorName] = useState<string | null>(null);

    useEffect(() => {
        async function fetchModule() {
            if (!id) return;

            const docRef = doc(db, "modules", id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data() as Module & { authorId?: string };
                setMod({ ...data });

                if (data.authorId) {
                    const authorRef = doc(db, "users", data.authorId);
                    const authorSnap = await getDoc(authorRef);
                    if (authorSnap.exists()) {
                        const authorData = authorSnap.data();
                        setAuthorName(authorData.full_name || "Unknown");
                    } else {
                        setAuthorName("Unknown");
                    }
                }
            }
        }

        fetchModule();
    }, [id]);

    if (!mod) return <p className="p-8">Loading...</p>;

    return (
        <div className="p-8 space-y-6 relative">
            <div className="flex justify-between items-start">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-green-700">
                        {mod.title}
                    </h1>
                    <div className="text-sm text-muted-foreground">
                        Updated 8 May 2025 • English • 15 minutes
                    </div>
                </div>
                {authorName && (
                    <div className="text-right text-sm text-muted-foreground">
                        <span className="font-medium">By:</span> {authorName}
                    </div>
                )}
            </div>

            <img
                src={mod.image}
                alt={mod.title}
                className="rounded-md w-full max-w-md"
            />

            <div className="prose max-w-3xl">{mod.content}</div>

            <div className="mt-8">
                <h3 className="font-semibold mb-2">
                    How do you usually respond to stress? Write down 3 thoughts
                </h3>
                <textarea className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[100px]" />
            </div>

            {mod.quiz?.length > 0 && (
                <div className="mt-8 space-y-4">
                    <h3 className="font-bold text-lg">QUIZ</h3>
                    {mod.quiz.map((q, i) => (
                        <div key={i} className="space-y-2">
                            <p>{q.question}</p>
                            <ul className="list-disc list-inside space-y-1">
                                {q.options.map((opt, j) => (
                                    <li key={j}>{opt}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
