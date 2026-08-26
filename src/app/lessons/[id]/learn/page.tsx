"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { api } from "@/lib/api";
import MultipleChoiceExercise from "@/components/learning/MultipleChoiceExercise";

interface Lesson {
    id: number;
    title: string;
    description?: string | null;
    number?: number | null;
}

interface Exercise {
    id: number;
    type?: string | null;
    question?: string | null;
    prompt?: string | null;
    points: number;
    number?: number | null;
}

interface ExerciseOption {
    id: number;
    text?: string | null;
    label?: string | null;
    value?: string | null;
}

interface SubmitResult {
    exerciseId: number;
    correct: boolean;
    score: number;
    maxScore: number;
    correctAnswer?: string | null;
    attemptId: number;
}

interface LessonProgress {
    id?: number;
    lessonId: number;
    status?: string | null;
    progress?: number | null;
    score?: number | null;
    startedAt?: string | null;
    completedAt?: string | null;
}

export default function LessonLearnPage() {
    const params = useParams();
    const router = useRouter();

    const lessonId = Number(params.id);

    const [lesson, setLesson] =
        useState<Lesson | null>(null);

    const [exercises, setExercises] =
        useState<Exercise[]>([]);

    const [options, setOptions] =
        useState<ExerciseOption[]>([]);

    const [lessonProgress, setLessonProgress] =
        useState<LessonProgress | null>(null);

    const [currentIndex, setCurrentIndex] =
        useState(0);

    const [selectedOption, setSelectedOption] =
        useState<number | null>(null);

    const [result, setResult] =
        useState<SubmitResult | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [loadingOptions, setLoadingOptions] =
        useState(false);

    const [submitting, setSubmitting] =
        useState(false);

    const [starting, setStarting] =
        useState(false);

    const [completed, setCompleted] =
        useState(false);

    const [error, setError] =
        useState("");

    const currentExercise =
        exercises[currentIndex];

    useEffect(() => {
        if (!Number.isFinite(lessonId)) {
            setError("Invalid lesson ID.");
            setLoading(false);
            return;
        }

        async function loadLesson() {
            try {
                setLoading(true);
                setError("");

                const [
                    lessonData,
                    exerciseData,
                ] = await Promise.all([
                    api<Lesson>(
                        `/lessons/${lessonId}`,
                    ),
                    api<Exercise[]>(
                        `/exercises/lesson/${lessonId}`,
                    ),
                ]);

                setLesson(lessonData);
                setExercises(exerciseData);

                /*
                 * Load existing progress.
                 */
                try {
                    const progress =
                        await api<LessonProgress[]>(
                            `/lesson-progress/lesson/${lessonId}`,
                        );

                    /*
                     * The endpoint is not user-filtered.
                     * We try to find the current user's
                     * record by asking /auth/me.
                     */
                    try {
                        const user =
                            await api<{ id: number }>(
                                "/auth/me",
                            );

                        const current =
                            progress.find(
                                (item) =>
                                    (
                                        item as LessonProgress & {
                                            userId?: number;
                                        }
                                    ).userId === user.id,
                            );

                        if (current) {
                            setLessonProgress(current);
                        }
                    } catch {
                        /*
                         * Progress is optional for rendering.
                         */
                    }
                } catch {
                    setLessonProgress(null);
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

    useEffect(() => {
        if (!currentExercise) {
            return;
        }

        async function loadOptions() {
            try {
                setLoadingOptions(true);
                setOptions([]);
                setSelectedOption(null);
                setResult(null);
                setError("");

                const data =
                    await api<ExerciseOption[]>(
                        `/exercises/${currentExercise.id}/options`,
                    );

                setOptions(data);
            } catch (err) {
                console.error(err);

                setOptions([]);

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load exercise options.",
                );
            } finally {
                setLoadingOptions(false);
            }
        }

        loadOptions();
    }, [currentExercise]);

    async function startLesson() {
        if (starting) {
            return;
        }

        try {
            setStarting(true);
            setError("");

            const progress =
                await api<LessonProgress>(
                    `/lesson-progress/${lessonId}/start`,
                    {
                        method: "POST",
                    },
                );

            setLessonProgress(progress);
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

    async function submitAnswer() {
        if (
            !currentExercise ||
            selectedOption === null ||
            submitting
        ) {
            return;
        }

        const selected =
            options.find(
                (option) =>
                    option.id === selectedOption,
            );

        if (!selected) {
            setError("Selected answer was not found.");
            return;
        }

        const answer =
            selected.text ??
            selected.label ??
            selected.value ??
            "";

        if (!answer.trim()) {
            setError("This option does not contain an answer.");
            return;
        }

        try {
            setSubmitting(true);
            setError("");

            /*
             * Your backend currently compares dto.answer
             * with Exercise.answer, so we submit the
             * selected option's text.
             */
            const submission =
                await api<SubmitResult>(
                    `/exercises/${currentExercise.id}/submit`,
                    {
                        method: "POST",
                        body: JSON.stringify({
                            answer,
                        }),
                    },
                );

            setResult(submission);

            /*
             * Don't automatically move to the next question.
             * Let the learner see the result first.
             */
        } catch (err) {
            console.error(err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to submit answer.",
            );
        } finally {
            setSubmitting(false);
        }
    }

    async function continueToNextExercise() {
        if (!result) {
            return;
        }

        const nextIndex =
            currentIndex + 1;

        /*
         * Last exercise.
         */
        if (nextIndex >= exercises.length) {
            if (result.correct) {
                try {
                    await api(
                        `/lesson-progress/${lessonId}/complete`,
                        {
                            method: "POST",
                        },
                    );

                    setCompleted(true);
                } catch (err) {
                    console.error(err);

                    setError(
                        err instanceof Error
                            ? err.message
                            : "Unable to complete lesson.",
                    );
                }
            }

            return;
        }

        /*
         * Save lesson progress.
         */
        try {
            const progress =
                Math.round(
                    (nextIndex /
                        exercises.length) *
                    100,
                );

            const updated =
                await api<LessonProgress>(
                    `/lesson-progress/${lessonId}/progress`,
                    {
                        method: "POST",
                        body: JSON.stringify({
                            progress,
                            score: result.score,
                        }),
                    },
                );

            setLessonProgress(updated);
        } catch (err) {
            console.error(err);
        }

        setCurrentIndex(nextIndex);
    }

    const progressPercentage = useMemo(() => {
        if (!exercises.length) {
            return 0;
        }

        if (lessonProgress?.progress != null) {
            return Math.min(
                100,
                Math.max(
                    0,
                    lessonProgress.progress,
                ),
            );
        }

        return Math.round(
            (currentIndex /
                exercises.length) *
            100,
        );
    }, [
        currentIndex,
        exercises.length,
        lessonProgress?.progress,
    ]);

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-zinc-50">
                <p className="text-sm text-zinc-500">
                    Loading lesson...
                </p>
            </main>
        );
    }

    if (completed) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
                <div className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-zinc-900 text-3xl text-white">
                        ✓
                    </div>

                    <p className="mt-6 text-sm font-medium uppercase tracking-wider text-zinc-400">
                        Lesson complete
                    </p>

                    <h1 className="mt-2 text-3xl font-bold">
                        {lesson?.title ?? "Well done!"}
                    </h1>

                    <p className="mt-3 text-zinc-500">
                        You've completed all the exercises
                        in this lesson.
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            router.back()
                        }
                        className="mt-8 w-full rounded-2xl bg-zinc-900 px-6 py-4 font-semibold text-white transition hover:bg-zinc-800"
                    >
                        Back to course
                    </button>
                </div>
            </main>
        );
    }

    if (!lesson) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
                    Lesson not found.
                </div>
            </main>
        );
    }

    if (exercises.length === 0) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
                <div className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-10 text-center">
                    <h1 className="text-2xl font-bold">
                        No exercises yet
                    </h1>

                    <p className="mt-3 text-sm text-zinc-500">
                        This lesson doesn't have any exercises.
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            router.back()
                        }
                        className="mt-8 rounded-xl bg-zinc-900 px-6 py-3 font-semibold text-white"
                    >
                        Go back
                    </button>
                </div>
            </main>
        );
    }

    const question =
        currentExercise.question ??
        currentExercise.prompt ??
        "Answer the question";

    const hasResult =
        result !== null;

    return (
        <main className="min-h-screen bg-zinc-50 text-zinc-900">
            <header className="border-b border-zinc-200 bg-white">
                <div className="mx-auto flex h-16 max-w-4xl items-center gap-5 px-6">
                    <button
                        type="button"
                        onClick={() =>
                            router.back()
                        }
                        className="text-xl text-zinc-400 transition hover:text-zinc-900"
                        aria-label="Exit lesson"
                    >
                        ×
                    </button>

                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
                        <div
                            className="h-full rounded-full bg-zinc-900 transition-all duration-300"
                            style={{
                                width: `${progressPercentage}%`,
                            }}
                        />
                    </div>

                    <span className="whitespace-nowrap text-sm font-medium text-zinc-500">
                        {currentIndex + 1} /{" "}
                        {exercises.length}
                    </span>
                </div>
            </header>

            <div className="mx-auto max-w-3xl px-6 py-10">
                <div className="mb-8">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        {lesson.title}
                    </p>

                    <p className="mt-2 text-sm text-zinc-500">
                        {progressPercentage}% complete
                    </p>
                </div>

                <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
                    <div className="flex items-center justify-between">
                        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-600">
                            {currentExercise.type ??
                                "Exercise"}
                        </span>

                        <span className="text-sm text-zinc-400">
                            {currentExercise.points}{" "}
                            point
                            {currentExercise.points === 1
                                ? ""
                                : "s"}
                        </span>
                    </div>

                    {loadingOptions ? (
                        <div className="mt-10">
                            <p className="text-zinc-500">
                                Loading question...
                            </p>
                        </div>
                    ) : options.length > 0 ? (
                        <div className="mt-8">
                            <MultipleChoiceExercise
                                question={question}
                                options={options.map(
                                    (option) => ({
                                        id: option.id,
                                        text:
                                            option.text ??
                                            option.label ??
                                            option.value ??
                                            "",
                                    }),
                                )}
                                selectedOption={
                                    selectedOption
                                }
                                disabled={hasResult}
                                onSelect={
                                    setSelectedOption
                                }
                            />
                        </div>
                    ) : (
                        <div className="mt-8">
                            <h1 className="text-3xl font-bold">
                                {question}
                            </h1>

                            <p className="mt-4 text-sm text-zinc-500">
                                This exercise does not
                                currently have selectable
                                options.
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {result && (
                        <div
                            className={[
                                "mt-8 rounded-2xl border p-5",
                                result.correct
                                    ? "border-zinc-200 bg-zinc-50"
                                    : "border-red-200 bg-red-50",
                            ].join(" ")}
                        >
                            <p className="text-lg font-bold">
                                {result.correct
                                    ? "Correct!"
                                    : "Not quite."}
                            </p>

                            <p className="mt-2 text-sm text-zinc-600">
                                You earned{" "}
                                <span className="font-semibold">
                                    {result.score}
                                </span>{" "}
                                of{" "}
                                <span className="font-semibold">
                                    {result.maxScore}
                                </span>{" "}
                                points.
                            </p>

                            {!result.correct &&
                                result.correctAnswer && (
                                    <p className="mt-3 text-sm text-zinc-600">
                                        Correct answer:{" "}
                                        <span className="font-semibold">
                                            {
                                                result.correctAnswer
                                            }
                                        </span>
                                    </p>
                                )}
                        </div>
                    )}

                    {!hasResult ? (
                        <button
                            type="button"
                            onClick={submitAnswer}
                            disabled={
                                selectedOption ===
                                null ||
                                submitting ||
                                loadingOptions
                            }
                            className="mt-10 w-full rounded-2xl bg-zinc-900 px-6 py-4 font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {submitting
                                ? "Checking..."
                                : "Check answer"}
                        </button>
                    ) : result.correct ? (
                        <button
                            type="button"
                            onClick={
                                continueToNextExercise
                            }
                            className="mt-10 w-full rounded-2xl bg-zinc-900 px-6 py-4 font-semibold text-white transition hover:bg-zinc-800"
                        >
                            {currentIndex ===
                            exercises.length - 1
                                ? "Finish lesson"
                                : "Continue"}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={
                                continueToNextExercise
                            }
                            className="mt-10 w-full rounded-2xl bg-zinc-900 px-6 py-4 font-semibold text-white transition hover:bg-zinc-800"
                        >
                            Continue
                        </button>
                    )}
                </div>
            </div>
        </main>
    );
}