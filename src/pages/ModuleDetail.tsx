"use client";

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { firestore as db } from "@/lib/firebase";
import { MoreVertical, Clock, Globe, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { Module } from "@/types/module";
import { getCurrUserId, getCurrUserRole } from "@/handlers/auth";

export default function ModuleDetailPage() {
    const { id } = useParams();
    const [mod, setMod] = useState<Module | null>(null);
    const [authorName, setAuthorName] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
    const [showResults, setShowResults] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            if (!id) return;

            try {
                const docRef = doc(db, "modules", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data() as Module;
                    setMod(data);

                    if (data.author_id) {
                        const authorRef = doc(db, "experts", data.author_id);
                        const authorSnap = await getDoc(authorRef);
                        if (authorSnap.exists()) {
                            const authorData = authorSnap.data();
                            setAuthorName(authorData.full_name || "Unknown");
                        } else {
                            setAuthorName("Unknown");
                        }
                    }
                }

                const [role, userId] = await Promise.all([
                    getCurrUserRole(),
                    getCurrUserId(),
                ]);
                setUserRole(role);
                setCurrentUserId(userId);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [id]);

    const canEditModule = () => {
        return userRole === "admin" || currentUserId === mod?.author_id;
    };

    const handleQuizAnswer = (questionIndex: number, answer: string) => {
        setQuizAnswers((prev) => ({
            ...prev,
            [questionIndex]: answer,
        }));
    };

    const handleSubmitQuiz = () => {
        setShowResults(true);
    };

    const getQuizScore = () => {
        if (!mod?.quiz) return 0;
        let correct = 0;
        mod.quiz.forEach((question, index) => {
            if (quizAnswers[index] === question.answer) {
                correct++;
            }
        });
        return Math.round((correct / mod.quiz.length) * 100);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto">
                        <p className="text-muted-foreground">
                            Loading module...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (!mod) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-muted-foreground">Module not found</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div className="space-y-4">
                <div className="flex justify-between items-start">
                    <div className="space-y-3 flex-1">
                        <h1 className="text-4xl font-bold text-green-700 leading-tight">
                            {mod.title}
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl">
                            {mod.description}
                        </p>
                    </div>

                    {canEditModule() && (
                        <DropdownMenu>
                            <DropdownMenuTrigger>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                    <span className="sr-only">Open menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>Edit Module</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                    Delete Module
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                            Updated at{" "}
                            {mod.last_modified.toDate().toUTCString()}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Globe className="h-4 w-4" />
                        <span>English</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>
                            {Math.max(1, Math.ceil(mod.content.length / 500))}{" "}
                            minute
                            {Math.max(1, Math.ceil(mod.content.length / 500)) >
                            1
                                ? "s"
                                : ""}
                        </span>
                    </div>
                    {authorName && (
                        <Badge variant="secondary" className="ml-auto">
                            By {authorName}
                        </Badge>
                    )}
                </div>
            </div>

            <Separator />

            <div className="space-y-6 flex gap-5">
                {mod.image_url && (
                    <div className="flex justify-center w-2/6 align-middle">
                        <img
                            src={mod.image_url}
                            alt={mod.title}
                            className="rounded-lg max-w-full h-auto max-h-96 object-cover"
                        />
                    </div>
                )}

                <div className="prose prose-lg max-w-none w-4/6">
                    <div dangerouslySetInnerHTML={{ __html: mod.content }} />
                </div>
            </div>

            {mod.quiz && mod.quiz.length > 0 && (
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-green-700">
                            Knowledge Check
                        </CardTitle>
                        <p className="text-muted-foreground">
                            Test your understanding of the material
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {mod.quiz.map((question, questionIndex) => (
                            <div key={questionIndex} className="space-y-4">
                                <h4 className="font-semibold text-lg">
                                    {questionIndex + 1}. {question.question}
                                </h4>

                                <RadioGroup
                                    value={quizAnswers[questionIndex] || ""}
                                    onValueChange={(value) =>
                                        handleQuizAnswer(questionIndex, value)
                                    }
                                    disabled={showResults}>
                                    {question.options.map(
                                        (option, optionIndex) => {
                                            const isCorrect =
                                                option === question.answer;
                                            const isSelected =
                                                quizAnswers[questionIndex] ===
                                                option;

                                            return (
                                                <div
                                                    key={optionIndex}
                                                    className={`flex items-center space-x-2 p-3 rounded-md border transition-colors ${
                                                        showResults
                                                            ? isCorrect
                                                                ? "bg-green-50 border-green-200"
                                                                : isSelected &&
                                                                  !isCorrect
                                                                ? "bg-red-50 border-red-200"
                                                                : "bg-gray-50"
                                                            : "hover:bg-gray-50"
                                                    }`}>
                                                    <RadioGroupItem
                                                        value={option}
                                                        id={`q${questionIndex}-${optionIndex}`}
                                                    />
                                                    <Label
                                                        htmlFor={`q${questionIndex}-${optionIndex}`}
                                                        className={`flex-1 cursor-pointer ${
                                                            showResults &&
                                                            isCorrect
                                                                ? "font-medium text-green-700"
                                                                : ""
                                                        }`}>
                                                        {option}
                                                    </Label>
                                                    {showResults &&
                                                        isCorrect && (
                                                            <Badge
                                                                variant="default"
                                                                className="bg-green-600">
                                                                Correct
                                                            </Badge>
                                                        )}
                                                </div>
                                            );
                                        }
                                    )}
                                </RadioGroup>

                                {questionIndex < mod.quiz.length - 1 && (
                                    <Separator />
                                )}
                            </div>
                        ))}

                        <div className="pt-4">
                            {!showResults ? (
                                <Button
                                    onClick={handleSubmitQuiz}
                                    disabled={
                                        Object.keys(quizAnswers).length !==
                                        mod.quiz.length
                                    }
                                    className="w-full bg-green-600 hover:bg-green-700">
                                    Submit Quiz
                                </Button>
                            ) : (
                                <Card className="bg-green-50 border-green-200">
                                    <CardContent className="pt-6">
                                        <div className="text-center space-y-2">
                                            <h3 className="text-xl font-bold text-green-700">
                                                Quiz Complete!
                                            </h3>
                                            <p className="text-lg">
                                                Your Score:{" "}
                                                <span className="font-bold">
                                                    {getQuizScore()}%
                                                </span>
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                You got{" "}
                                                {
                                                    Object.values(
                                                        quizAnswers
                                                    ).filter(
                                                        (answer, index) =>
                                                            answer ===
                                                            mod.quiz[index]
                                                                .answer
                                                    ).length
                                                }{" "}
                                                out of {mod.quiz.length}{" "}
                                                questions correct.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
