"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface Lesson {
    id: number;
    title: string;
    description?: string;
    number?: number;
    isActive?: boolean;
}

interface Vocabulary {
    id: number;
    word?: string;
    term?: string;
    translation?: string;
    meaning?: string;
}

interface LessonVocabulary {
    id: number;
    vocabularyId: number;
    vocabulary?: Vocabulary;
}

interface Exercise {
    id: number;
    type?: string;
    question?: string;
    prompt?: string;
    number?: number;
}

export default function LessonPage() {
    const params = useParams();
    const router = useRouter();

    const lessonId = params.id as string;

    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [vocabulary, setVocabulary] = useState<LessonVocabulary[]>([]);
    const [exercises, setExercises] = useState<Exercise[]>([]);

    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadLesson() {
            try {
                const [lessonData, vocabularyData, exercisesData] =
                    await Promise.all([
                        api<Lesson>(`/lessons/${lessonId}`),
                        api<LessonVocabulary[]>(
                            `/lesson-vocabulary/lesson/${lessonId}`,
                        ),
                        api<Exercise[]>(
                            `/exercises/lesson/${lessonId}`,
                        ),
                    ]);

                setLesson(lessonData);
                setVocabulary(vocabularyData);
                setExercises(exercisesData);
            } catch (err) {
                console.error(err);

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load lesson.",
                );
            } finally {
                setLoading(false);
            }
        }

        loadLesson();
    }, [lessonId]);

    async function startLesson() {
        try {
            setStarting(true);

            await api(`/lesson-progress/${lessonId}/start`, {
                method: "POST",
            });

            router.push(`/lessons/${lessonId}/learn`);
        } catch (err) {
            console.error(err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to start lesson.",
            );
        } finally {
            setStarting(false);
        }
    }

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-zinc-50">
                <p className="text-sm text-zinc-500">
                    Loading lesson...
                </p>
            </main>
        );
    }

    if (error || !lesson) {
        return (
            <main className="min-h-screen bg-zinc-50 px-6 py-12">
                <div className="mx-auto max-w-5xl">
                    <button
                        onClick={() => router.back()}
                        className="mb-8 text-sm font-medium text-zinc-600 hover:text-zinc-900"
                    >
                        ← Back
                    </button>

                    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
                        {error || "Lesson not found."}
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-zinc-50 text-zinc-900">
            <header className="border-b border-zinc-200 bg-white">
                <div className="mx-auto flex h-16 max-w-6xl items-center px-6">
                    <button
                        onClick={() => router.back()}
                        className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
                    >
                        ← Back
                    </button>

                    <div className="ml-6 text-xl font-bold">
                        LingoLearn
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-5xl px-6 py-12">
                {/* Lesson header */}

                <section className="rounded-3xl border border-zinc-200 bg-white p-8">
                    <p className="text-sm font-medium uppercase tracking-wider text-zinc-400">
                        Lesson {lesson.number ?? ""}
                    </p>

                    <h1 className="mt-2 text-4xl font-bold">
                        {lesson.title}
                    </h1>

                    {lesson.description && (
                        <p className="mt-4 max-w-2xl leading-7 text-zinc-600">
                            {lesson.description}
                        </p>
                    )}
                </section>

                {/* Vocabulary */}

                <section className="mt-10">
                    <div>
                        <h2 className="text-2xl font-bold">
                            Vocabulary
                        </h2>

                        <p className="mt-2 text-zinc-500">
                            Words you'll learn in this lesson.
                        </p>
                    </div>

                    {vocabulary.length === 0 ? (
                        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
                            No vocabulary has been added to this lesson yet.
                        </div>
                    ) : (
                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                            {vocabulary.map((item) => {
                                const word =
                                    item.vocabulary?.word ??
                                    item.vocabulary?.term ??
                                    "Vocabulary";

                                const translation =
                                    item.vocabulary?.translation ??
                                    item.vocabulary?.meaning ??
                                    "";

                                return (
                                    <div
                                        key={item.id}
                                        className="rounded-2xl border border-zinc-200 bg-white p-6"
                                    >
                                        <p className="text-xl font-bold">
                                            {word}
                                        </p>

                                        {translation && (
                                            <p className="mt-2 text-zinc-500">
                                                {translation}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Exercises */}

                <section className="mt-12">
                    <h2 className="text-2xl font-bold">
                        Exercises
                    </h2>

                    <p className="mt-2 text-zinc-500">
                        Practice what you learned.
                    </p>

                    {exercises.length === 0 ? (
                        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
                            No exercises have been added to this lesson yet.
                        </div>
                    ) : (
                        <div className="mt-6 space-y-3">
                            {exercises.map((exercise, index) => (
                                <div
                                    key={exercise.id}
                                    className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-5"
                                >
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-sm font-bold">
                                        {exercise.number ?? index + 1}
                                    </div>

                                    <div>
                                        <p className="font-semibold">
                                            {exercise.question ??
                                                exercise.prompt ??
                                                "Exercise"}
                                        </p>

                                        {exercise.type && (
                                            <p className="mt-1 text-xs uppercase tracking-wide text-zinc-400">
                                                {exercise.type}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Start */}

                <section className="mt-12">
                    <button
                        onClick={startLesson}
                        disabled={starting}
                        className="w-full rounded-2xl bg-zinc-900 px-6 py-4 text-center font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {starting ? "Starting lesson..." : "Start lesson →"}
                    </button>
                </section>
            </div>
        </main>
    );
}