"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { api } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

interface Lesson {
    id: number;
    title: string;
    description?: string | null;
    number?: number | null;
    unitId: number;
}

interface Vocabulary {
    id: number;
    word: string;
    translation: string;
    pronunciation?: string | null;
    example?: string | null;
}

interface LessonProgress {
    id?: number;
    lessonId: number;
    userId?: number;
    status?: string | null;
    progress?: number | null;
    score?: number | null;
    completedAt?: string | null;
}

interface User {
    id: number;
}

type QuestionType =
    | "translation"
    | "multiple-choice";

interface Question {
    vocabulary: Vocabulary;
    type: QuestionType;
    options: string[];
    answer: string;
}

export default function LessonLearnPage() {
    const params = useParams();
    const router = useRouter();

    const lessonId = Number(params.id);

    const [user, setUser] =
        useState<User | null>(null);

    const [lesson, setLesson] =
        useState<Lesson | null>(null);

    const [vocabulary, setVocabulary] =
        useState<Vocabulary[]>([]);

    const [currentIndex, setCurrentIndex] =
        useState(0);

    const [answer, setAnswer] =
        useState("");

    const [selectedAnswer, setSelectedAnswer] =
        useState<string | null>(null);

    const [submitted, setSubmitted] =
        useState(false);

    const [correct, setCorrect] =
        useState(false);

    const [score, setScore] =
        useState(0);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    const [completed, setCompleted] =
        useState(false);

    useEffect(() => {
        if (!Number.isFinite(lessonId)) {
            setError("Invalid lesson.");
            setLoading(false);
            return;
        }

        async function loadLesson() {
            try {
                setLoading(true);
                setError("");

                const [
                    lessonData,
                    currentUser,
                ] = await Promise.all([
                    api<Lesson>(
                        `/lessons/${lessonId}`,
                    ),
                    api<User>("/auth/me"),
                ]);

                setLesson(lessonData);
                setUser(currentUser);

                /*
                 * Load vocabulary belonging to
                 * this lesson.
                 *
                 * Adjust the endpoint here if your
                 * backend uses another route.
                 */
                const vocabularyData =
                    await api<Vocabulary[]>(
                        `/vocabulary/lesson/${lessonId}`,
                    );

                setVocabulary(
                    vocabularyData,
                );

                /*
                 * Load existing lesson progress.
                 * If the lesson was previously completed,
                 * start from the beginning but preserve
                 * the completed state.
                 */
                try {
                    const progress =
                        await api<LessonProgress>(
                            `/lesson-progress/user/${currentUser.id}/lesson/${lessonId}`,
                        );

                    if (
                        progress?.status ===
                        "COMPLETED" ||
                        progress?.completedAt
                    ) {
                        setScore(
                            Number(
                                progress.score ?? 0,
                            ),
                        );
                    }
                } catch {
                    // No previous progress.
                }
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

    const currentVocabulary =
        vocabulary[currentIndex];

    const question = useMemo<Question | null>(() => {
        if (!currentVocabulary) {
            return null;
        }

        /*
         * Every third question becomes
         * multiple choice.
         */
        const isMultipleChoice =
            currentIndex % 3 === 2;

        if (!isMultipleChoice) {
            return {
                vocabulary:
                currentVocabulary,
                type: "translation",
                options: [],
                answer:
                currentVocabulary.translation,
            };
        }

        const otherWords =
            vocabulary
                .filter(
                    (item) =>
                        item.id !==
                        currentVocabulary.id,
                )
                .map(
                    (item) =>
                        item.translation,
                )
                .filter(Boolean);

        const randomOptions =
            [...otherWords]
                .sort(
                    () =>
                        Math.random() -
                        0.5,
                )
                .slice(0, 3);

        const options = [
            currentVocabulary.translation,
            ...randomOptions,
        ].sort(
            () =>
                Math.random() -
                0.5,
        );

        return {
            vocabulary:
            currentVocabulary,
            type: "multiple-choice",
            options,
            answer:
            currentVocabulary.translation,
        };
    }, [
        currentVocabulary,
        currentIndex,
        vocabulary,
    ]);

    const progressPercent =
        vocabulary.length > 0
            ? Math.round(
                (currentIndex /
                    vocabulary.length) *
                100,
            )
            : 0;

    function normalize(value: string) {
        return value
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                "",
            );
    }

    function submitAnswer() {
        if (!question || submitted) {
            return;
        }

        const userAnswer =
            question.type ===
            "multiple-choice"
                ? selectedAnswer ?? ""
                : answer;

        if (!userAnswer.trim()) {
            return;
        }

        const isCorrect =
            normalize(userAnswer) ===
            normalize(question.answer);

        setCorrect(isCorrect);

        if (isCorrect) {
            setScore(
                (current) =>
                    current + 1,
            );
        }

        setSubmitted(true);
    }

    async function saveProgress(
        percent: number,
        finalScore: number,
        status: string,
    ) {
        if (!user) {
            return;
        }

        try {
            setSaving(true);

            await api(
                "/lesson-progress",
                {
                    method: "POST",
                    body: JSON.stringify({
                        userId: user.id,
                        lessonId,
                        progress: percent,
                        score: finalScore,
                        status,
                        ...(status ===
                        "COMPLETED"
                            ? {
                                completedAt:
                                    new Date().toISOString(),
                            }
                            : {}),
                    }),
                },
            );
        } catch (err) {
            console.error(
                "Could not save progress:",
                err,
            );
        } finally {
            setSaving(false);
        }
    }

    async function nextQuestion() {
        if (!submitted) {
            return;
        }

        const nextIndex =
            currentIndex + 1;

        if (
            nextIndex >=
            vocabulary.length
        ) {
            const finalScore =
                score;

            await saveProgress(
                100,
                finalScore,
                "COMPLETED",
            );

            setCompleted(true);
            return;
        }

        const percent =
            Math.round(
                (nextIndex /
                    vocabulary.length) *
                100,
            );

        await saveProgress(
            percent,
            score,
            "IN_PROGRESS",
        );

        setCurrentIndex(
            nextIndex,
        );

        setAnswer("");
        setSelectedAnswer(null);
        setSubmitted(false);
        setCorrect(false);
    }

    async function exitLesson() {
        await saveProgress(
            progressPercent,
            score,
            "IN_PROGRESS",
        );

        router.push(
            `/courses/${lesson?.unitId ?? ""}`,
        );
    }

    if (loading) {
        return (
            <ProtectedRoute>
                <main className="flex min-h-screen items-center justify-center bg-zinc-50">
                    <div className="text-center">
                        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />

                        <p className="mt-4 text-sm text-zinc-500">
                            Loading lesson...
                        </p>
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
                        <h1 className="text-xl font-bold">
                            Unable to load lesson
                        </h1>

                        <p className="mt-2 text-sm text-zinc-500">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                router.back()
                            }
                            className="mt-6 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white"
                        >
                            Go back
                        </button>
                    </div>
                </main>
            </ProtectedRoute>
        );
    }

    if (vocabulary.length === 0) {
        return (
            <ProtectedRoute>
                <main className="min-h-screen bg-zinc-50">
                    <header className="border-b border-zinc-200 bg-white">
                        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
                            <Link
                                href="/dashboard"
                                className="text-sm font-medium text-zinc-500"
                            >
                                ← Dashboard
                            </Link>
                        </div>
                    </header>

                    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-2xl">
                            📚
                        </div>

                        <h1 className="mt-6 text-2xl font-bold">
                            No vocabulary yet
                        </h1>

                        <p className="mt-2 text-zinc-500">
                            This lesson doesn't have
                            any vocabulary yet.
                        </p>

                        <Link
                            href="/dashboard"
                            className="mt-7 inline-flex rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white"
                        >
                            Back to dashboard
                        </Link>
                    </div>
                </main>
            </ProtectedRoute>
        );
    }

    if (completed) {
        const finalPercentage =
            vocabulary.length > 0
                ? Math.round(
                    (score /
                        vocabulary.length) *
                    100,
                )
                : 0;

        return (
            <ProtectedRoute>
                <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
                    <div className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm sm:p-10">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-zinc-900 text-3xl text-white">
                            ✓
                        </div>

                        <p className="mt-7 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                            Lesson complete
                        </p>

                        <h1 className="mt-2 text-3xl font-bold">
                            Great work!
                        </h1>

                        <p className="mt-3 text-zinc-500">
                            You completed{" "}
                            {lesson.title}.
                        </p>

                        <div className="mt-8 grid grid-cols-2 gap-4">
                            <div className="rounded-2xl bg-zinc-50 p-5">
                                <p className="text-3xl font-bold">
                                    {
                                        finalPercentage
                                    }
                                    %
                                </p>

                                <p className="mt-1 text-xs text-zinc-400">
                                    Score
                                </p>
                            </div>

                            <div className="rounded-2xl bg-zinc-50 p-5">
                                <p className="text-3xl font-bold">
                                    {
                                        vocabulary.length
                                    }
                                </p>

                                <p className="mt-1 text-xs text-zinc-400">
                                    Words
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Link
                                href="/dashboard"
                                className="flex-1 rounded-xl border border-zinc-200 px-5 py-3 text-sm font-semibold"
                            >
                                Dashboard
                            </Link>

                            <button
                                type="button"
                                onClick={() =>
                                    window.location.reload()
                                }
                                className="flex-1 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white"
                            >
                                Practice again
                            </button>
                        </div>
                    </div>
                </main>
            </ProtectedRoute>
        );
    }

    if (!question) {
        return null;
    }

    return (
        <ProtectedRoute>
            <main className="min-h-screen bg-zinc-50 text-zinc-900">
                {/* Header */}
                <header className="border-b border-zinc-200 bg-white">
                    <div className="mx-auto max-w-3xl px-6">
                        <div className="flex h-16 items-center gap-5">
                            <button
                                type="button"
                                onClick={
                                    exitLesson
                                }
                                className="text-zinc-400 transition hover:text-zinc-900"
                            >
                                ×
                            </button>

                            <div className="flex-1">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-medium text-zinc-500">
                                        {
                                            lesson.title
                                        }
                                    </span>

                                    <span className="text-zinc-400">
                                        {currentIndex +
                                            1}{" "}
                                        /{" "}
                                        {
                                            vocabulary.length
                                        }
                                    </span>
                                </div>

                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
                                    <div
                                        className="h-full rounded-full bg-zinc-900 transition-all duration-300"
                                        style={{
                                            width: `${Math.max(
                                                3,
                                                progressPercent,
                                            )}%`,
                                        }}
                                    />
                                </div>
                            </div>

                            <span className="text-sm font-semibold">
                                {score} pts
                            </span>
                        </div>
                    </div>
                </header>

                {/* Question */}
                <div className="mx-auto max-w-2xl px-6 py-10 sm:py-16">
                    <div className="text-center">
                        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                            {question.type ===
                            "multiple-choice"
                                ? "Choose the translation"
                                : "Translate this word"}
                        </p>

                        <div className="mt-8 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-12">
                            <p className="text-4xl font-bold tracking-tight sm:text-5xl">
                                {
                                    question
                                        .vocabulary
                                        .word
                                }
                            </p>

                            {question
                                .vocabulary
                                .pronunciation && (
                                <p className="mt-4 text-sm text-zinc-400">
                                    {
                                        question
                                            .vocabulary
                                            .pronunciation
                                    }
                                </p>
                            )}

                            {question
                                .vocabulary
                                .example && (
                                <p className="mx-auto mt-7 max-w-md text-sm italic leading-6 text-zinc-500">
                                    "
                                    {
                                        question
                                            .vocabulary
                                            .example
                                    }
                                    "
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Answer */}
                    <div className="mt-8">
                        {question.type ===
                        "multiple-choice" ? (
                            <div className="space-y-3">
                                {question.options.map(
                                    (
                                        option,
                                    ) => {
                                        const isSelected =
                                            selectedAnswer ===
                                            option;

                                        const isCorrectOption =
                                            submitted &&
                                            option ===
                                            question.answer;

                                        const isWrongSelection =
                                            submitted &&
                                            isSelected &&
                                            !correct;

                                        return (
                                            <button
                                                key={
                                                    option
                                                }
                                                type="button"
                                                disabled={
                                                    submitted
                                                }
                                                onClick={() =>
                                                    setSelectedAnswer(
                                                        option,
                                                    )
                                                }
                                                className={[
                                                    "w-full rounded-2xl border p-4 text-left font-medium transition",
                                                    isCorrectOption
                                                        ? "border-zinc-900 bg-zinc-900 text-white"
                                                        : isWrongSelection
                                                            ? "border-red-300 bg-red-50 text-red-700"
                                                            : isSelected
                                                                ? "border-zinc-900 bg-zinc-100"
                                                                : "border-zinc-200 bg-white hover:border-zinc-400",
                                                ].join(
                                                    " ",
                                                )}
                                            >
                                                {
                                                    option
                                                }
                                            </button>
                                        );
                                    },
                                )}
                            </div>
                        ) : (
                            <input
                                type="text"
                                value={answer}
                                onChange={(
                                    event,
                                ) =>
                                    setAnswer(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                onKeyDown={(
                                    event,
                                ) => {
                                    if (
                                        event.key ===
                                        "Enter" &&
                                        !submitted
                                    ) {
                                        submitAnswer();
                                    }
                                }}
                                disabled={
                                    submitted
                                }
                                placeholder="Type your answer..."
                                className="w-full rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-lg outline-none transition placeholder:text-zinc-300 focus:border-zinc-900"
                                autoFocus
                            />
                        )}
                    </div>

                    {/* Result */}
                    {submitted && (
                        <div
                            className={[
                                "mt-5 rounded-2xl p-5",
                                correct
                                    ? "bg-zinc-900 text-white"
                                    : "bg-red-50 text-red-800",
                            ].join(" ")}
                        >
                            <p className="font-bold">
                                {correct
                                    ? "Correct! 🎉"
                                    : "Not quite."}
                            </p>

                            {!correct && (
                                <p className="mt-1 text-sm opacity-80">
                                    Correct answer:{" "}
                                    <strong>
                                        {
                                            question.answer
                                        }
                                    </strong>
                                </p>
                            )}
                        </div>
                    )}

                    {/* Action */}
                    <div className="mt-6">
                        {!submitted ? (
                            <button
                                type="button"
                                onClick={
                                    submitAnswer
                                }
                                disabled={
                                    question.type ===
                                    "multiple-choice"
                                        ? !selectedAnswer
                                        : !answer.trim()
                                }
                                className="w-full rounded-2xl bg-zinc-900 px-6 py-4 font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Check answer
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={
                                    nextQuestion
                                }
                                disabled={
                                    saving
                                }
                                className="w-full rounded-2xl bg-zinc-900 px-6 py-4 font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
                            >
                                {saving
                                    ? "Saving..."
                                    : currentIndex +
                                    1 >=
                                    vocabulary.length
                                        ? "Finish lesson"
                                        : "Continue →"}
                            </button>
                        )}
                    </div>
                </div>
            </main>
        </ProtectedRoute>
    );
}