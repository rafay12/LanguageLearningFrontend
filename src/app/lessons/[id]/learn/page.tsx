"use client";

import {
    useCallback,
    useEffect,
    useState,
} from "react";

import { useParams } from "next/navigation";

import ProtectedRoute from "@/components/ProtectedRoute";
import { api } from "@/lib/api";

import LessonEngine, {
    LessonActivity,
    LessonResult,
} from "@/components/lesson/LessonEngine";

interface Lesson {
    id: number;
    unitId: number;
    title: string;
    description?: string | null;
    number: number;
}

interface LessonResponse {
    lesson: Lesson;
    activities?: LessonActivity[];
}

export default function LessonLearnPage() {
    const params = useParams();

    const lessonId =
        Number(params.id);

    const [lesson, setLesson] =
        useState<Lesson | null>(null);

    const [activities, setActivities] =
        useState<LessonActivity[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const loadLesson =
        useCallback(async () => {
            try {
                setLoading(true);
                setError(null);

                const data =
                    await api<LessonResponse>(
                        `/lessons/${lessonId}`,
                    );

                setLesson(
                    data.lesson,
                );

                setActivities(
                    data.activities ?? [],
                );
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load lesson.",
                );
            } finally {
                setLoading(false);
            }
        }, [lessonId]);

    useEffect(() => {
        if (
            lessonId &&
            !Number.isNaN(
                lessonId,
            )
        ) {
            void loadLesson();
        }
    }, [
        lessonId,
        loadLesson,
    ]);

    async function handleComplete(
        result: LessonResult,
    ) {
        /*
         * Keep the lesson engine independent
         * from the backend.
         *
         * We attempt to save progress using
         * the existing lesson-progress route.
         *
         * If your backend uses a different
         * route, only this function needs
         * to be adapted.
         */
        try {
            await api(
                `/lesson-progress/${result.lessonId}`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        progress: 100,
                        status: "completed",
                        score: result.percentage,
                    }),
                },
            );
        } catch {
            /*
             * Do not destroy the completed lesson
             * screen if progress saving fails.
             */
            console.warn(
                "Unable to save lesson progress.",
            );
        }
    }

    if (loading) {
        return (
            <ProtectedRoute>
                <main className="min-h-screen bg-zinc-50">
                    <div className="mx-auto max-w-3xl px-6 py-10">
                        <div className="h-6 w-32 animate-pulse rounded bg-zinc-200" />

                        <div className="mt-8 h-[500px] animate-pulse rounded-3xl bg-zinc-200" />
                    </div>
                </main>
            </ProtectedRoute>
        );
    }

    if (error || !lesson) {
        return (
            <ProtectedRoute>
                <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
                    <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 text-center">
                        <h1 className="text-xl font-bold text-zinc-900">
                            Lesson unavailable
                        </h1>

                        <p className="mt-3 text-sm text-red-600">
                            {error ??
                                "Lesson not found."}
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                void loadLesson()
                            }
                            className="mt-6 rounded-2xl bg-zinc-900 px-6 py-3 font-semibold text-white"
                        >
                            Try again
                        </button>
                    </div>
                </main>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <LessonEngine
                lessonId={
                    lesson.id
                }
                lessonTitle={
                    lesson.title
                }
                activities={
                    activities
                }
                onComplete={
                    handleComplete
                }
            />
        </ProtectedRoute>
    );
}