"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { api } from "@/lib/api";
import MultipleChoiceExercise from "@/components/learning/MultipleChoiceExercise";

interface Exercise {
    id: number;
    type?: string;
    question?: string;
    prompt?: string;
    answer?: string;
    points: number;
    number?: number;
}

interface ExerciseOption {
    id: number;
    text?: string;
    label?: string;
    value?: string;
}

interface SubmitResult {
    exerciseId: number;
    correct: boolean;
    score: number;
    maxScore: number;
    correctAnswer?: string;
    attemptId: number;
}

export default function LessonLearnPage() {
    const params = useParams();
    const router = useRouter();

    const lessonId = params.id as string;

    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [options, setOptions] = useState<ExerciseOption[]>([]);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] =
        useState<number | null>(null);

    const [result, setResult] =
        useState<SubmitResult | null>(null);

    const [loading, setLoading] = useState(true);
    const [loadingOptions, setLoadingOptions] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [completed, setCompleted] = useState(false);
    const [error, setError] = useState("");

    const currentExercise = exercises[currentIndex];

    useEffect(() => {
        async function loadExercises() {
            try {
                const data = await api<Exercise[]>(
                    `/exercises/lesson/${lessonId}`,
                );

                setExercises(data);
            } catch (err) {
                console.error(err);

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load exercises.",
                );
            } finally {
                setLoading(false);
            }
        }

        loadExercises();
    }, [lessonId]);

    useEffect(() => {
        if (!currentExercise) {
            return;
        }

        async function loadOptions() {
            setLoadingOptions(true);
            setOptions([]);
            setSelectedOption(null);
            setResult(null);

            try {
                const data = await api<ExerciseOption[]>(
                    `/exercises/${currentExercise.id}/options`,
                );

                setOptions(data);
            } catch (err) {
                console.error(err);

                setOptions([]);
            } finally {
                setLoadingOptions(false);
            }
        }

        loadOptions();
    }, [currentExercise]);

    async function submitAnswer() {
        if (
            !currentExercise ||
            selectedOption === null ||
            submitting
        ) {
            return;
        }

        const selected = options.find(
            (option) => option.id === selectedOption,
        );

        if (!selected) {
            return;
        }

        const answer =
            selected.text ??
            selected.label ??
            selected.value ??
            "";

        if (!answer) {
            setError("This option does not contain an answer.");
            return;
        }

        try {
            setSubmitting(true);
            setError("");

            const submission = await api<SubmitResult>(
                `/exercises/${currentExercise.id}/submit`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        answer,
                    }),
                },
            );

            setResult(submission);

            const nextIndex = currentIndex + 1;

            if (
                submission.correct &&
                nextIndex >= exercises.length
            ) {
                await api(
                    `/lesson-progress/${lessonId}/complete`,
                    {
                        method: "POST",
                    },
                );

                setCompleted(true);
            }
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

    async function nextExercise() {
        if (currentIndex >= exercises.length - 1) {
            return;
        }

        const nextIndex = currentIndex + 1;

        try {
            await api(
                `/lesson-progress/${lessonId}/progress`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        progress: Math.round(
                            (currentIndex / exercises.length) * 100,
                        ),
                    }),
                },
            );
        } catch (err) {
            console.error(err);
        }

        setCurrentIndex(nextIndex);
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

    if (error && exercises.length === 0) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
                <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
                    {error}
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
                        This lesson does not contain any exercises.
                    </p>

                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="mt-8 rounded-xl bg-zinc-900 px-6 py-3 font-semibold text-white"
                    >
                        Go back
                    </button>
                </div>
            </main>
        );
    }

    if (completed) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
                <div className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-10 text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 text-3xl">
                        ✓
                    </div>

                    <h1 className="mt-6 text-3xl font-bold">
                        Lesson complete!
                    </h1>

                    <p className="mt-3 text-zinc-500">
                        Great work. You completed this lesson.
                    </p>

                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="mt-8 w-full rounded-xl bg-zinc-900 px-6 py-4 font-semibold text-white hover:bg-zinc-800"
                    >
                        Continue
                    </button>
                </div>
            </main>
        );
    }

    const question =
        currentExercise.question ??
        currentExercise.prompt ??
        "Answer the question";

    const hasResult = result !== null;

    const progress =
        exercises.length > 0
            ? (currentIndex / exercises.length) * 100
            : 0;

    return (
        <main className="min-h-screen bg-zinc-50 text-zinc-900">
            <header className="border-b border-zinc-200 bg-white">
                <div className="mx-auto flex h-16 max-w-4xl items-center gap-5 px-6">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="text-lg text-zinc-500 hover:text-zinc-900"
                    >
                        ×
                    </button>

                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
                        <div
                            className="h-full rounded-full bg-zinc-900 transition-all"
                            style={{
                                width: `${progress}%`,
                            }}
                        />
                    </div>

                    <span className="whitespace-nowrap text-sm font-medium text-zinc-500">
            {currentIndex + 1} / {exercises.length}
          </span>
                </div>
            </header>

            <div className="mx-auto max-w-3xl px-6 py-12">
                <div className="rounded-3xl border border-zinc-200 bg-white p-8 sm:p-12">
                    <p className="text-sm font-medium uppercase tracking-wider text-zinc-400">
                        {currentExercise.type ?? "Exercise"}
                    </p>

                    {loadingOptions ? (
                        <div className="mt-8">
                            <p className="text-zinc-500">
                                Loading question...
                            </p>
                        </div>
                    ) : options.length > 0 ? (
                        <MultipleChoiceExercise
                            question={question}
                            options={options.map((option) => ({
                                id: option.id,
                                text:
                                    option.text ??
                                    option.label ??
                                    option.value ??
                                    "",
                            }))}
                            selectedOption={selectedOption}
                            disabled={hasResult}
                            onSelect={setSelectedOption}
                        />
                    ) : (
                        <div className="mt-8">
                            <h1 className="text-3xl font-bold">
                                {question}
                            </h1>

                            <p className="mt-4 text-sm text-zinc-500">
                                This exercise does not currently have selectable
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
                            className={`mt-8 rounded-2xl border p-5 ${
                                result.correct
                                    ? "border-zinc-200 bg-zinc-50"
                                    : "border-red-200 bg-red-50"
                            }`}
                        >
                            <p className="text-lg font-bold">
                                {result.correct
                                    ? "Correct!"
                                    : "Not quite."}
                            </p>

                            <p className="mt-2 text-sm text-zinc-600">
                                Score: {result.score} / {result.maxScore}
                            </p>

                            {!result.correct &&
                                result.correctAnswer && (
                                    <p className="mt-2 text-sm text-zinc-600">
                                        Correct answer:{" "}
                                        <span className="font-semibold">
                      {result.correctAnswer}
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
                                selectedOption === null ||
                                submitting ||
                                loadingOptions
                            }
                            className="mt-10 w-full rounded-2xl bg-zinc-900 px-6 py-4 font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {submitting
                                ? "Checking..."
                                : "Check answer"}
                        </button>
                    ) : currentIndex <
                    exercises.length - 1 ? (
                        <button
                            type="button"
                            onClick={nextExercise}
                            className="mt-10 w-full rounded-2xl bg-zinc-900 px-6 py-4 font-semibold text-white transition hover:bg-zinc-800"
                        >
                            Continue
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() =>
                                result.correct
                                    ? setCompleted(true)
                                    : router.back()
                            }
                            className="mt-10 w-full rounded-2xl bg-zinc-900 px-6 py-4 font-semibold text-white transition hover:bg-zinc-800"
                        >
                            {result.correct
                                ? "Finish lesson"
                                : "Return to lesson"}
                        </button>
                    )}
                </div>
            </div>
        </main>
    );
}