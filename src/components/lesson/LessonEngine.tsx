"use client";

import {
    useMemo,
    useState,
} from "react";

import Flashcard from "./Flashcard";
import MultipleChoice from "./MultipleChoice";
import TranslationExercise from "./TranslationExercise";
import ExerciseShell from "./ExerciseShell";

export type LessonActivityType =
    | "flashcard"
    | "multiple_choice"
    | "translation"
    | "listening";

export interface LessonActivity {
    id: number;
    type: LessonActivityType;

    question?: string | null;

    front?: string | null;
    back?: string | null;

    pronunciation?: string | null;
    example?: string | null;

    options?: string[] | null;

    correctAnswer?: string | null;

    correctAnswers?: string[] | null;

    sourceLanguage?: string | null;
    targetLanguage?: string | null;
}

interface LessonEngineProps {
    lessonId: number;
    lessonTitle: string;
    activities: LessonActivity[];
    onComplete?: (
        result: LessonResult,
    ) => void;
}

export interface LessonResult {
    lessonId: number;
    totalActivities: number;
    correctAnswers: number;
    incorrectAnswers: number;
    percentage: number;
}

export default function LessonEngine({
                                         lessonId,
                                         lessonTitle,
                                         activities,
                                         onComplete,
                                     }: LessonEngineProps) {
    const [currentIndex, setCurrentIndex] =
        useState(0);

    const [correctAnswers, setCorrectAnswers] =
        useState(0);

    const [incorrectAnswers, setIncorrectAnswers] =
        useState(0);

    const [answered, setAnswered] =
        useState(false);

    const [finished, setFinished] =
        useState(false);

    const currentActivity =
        activities[currentIndex];

    const isLastActivity =
        currentIndex ===
        activities.length - 1;

    const percentage = useMemo(() => {
        if (activities.length === 0) {
            return 0;
        }

        return Math.round(
            (correctAnswers /
                activities.length) *
            100,
        );
    }, [
        correctAnswers,
        activities.length,
    ]);

    function handleAnswer(
        correct: boolean,
    ) {
        if (answered) {
            return;
        }

        setAnswered(true);

        if (correct) {
            setCorrectAnswers(
                (value) => value + 1,
            );
        } else {
            setIncorrectAnswers(
                (value) => value + 1,
            );
        }
    }

    function continueLesson() {
        if (!answered) {
            return;
        }

        if (isLastActivity) {
            finishLesson();
            return;
        }

        setCurrentIndex(
            (value) => value + 1,
        );

        setAnswered(false);
    }

    function finishLesson() {
        const finalCorrect =
            correctAnswers;

        const finalIncorrect =
            incorrectAnswers;

        const result: LessonResult = {
            lessonId,
            totalActivities:
            activities.length,
            correctAnswers:
            finalCorrect,
            incorrectAnswers:
            finalIncorrect,
            percentage:
                activities.length > 0
                    ? Math.round(
                        (finalCorrect /
                            activities.length) *
                        100,
                    )
                    : 0,
        };

        setFinished(true);

        onComplete?.(result);
    }

    if (activities.length === 0) {
        return (
            <main className="min-h-screen bg-zinc-50">
                <div className="mx-auto max-w-3xl px-6 py-10">
                    <div className="rounded-3xl border border-zinc-200 bg-white p-10 text-center">
                        <h1 className="text-2xl font-bold text-zinc-900">
                            Lesson unavailable
                        </h1>

                        <p className="mt-3 text-zinc-500">
                            This lesson does not have any
                            activities yet.
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    if (finished) {
        return (
            <main className="min-h-screen bg-zinc-50">
                <div className="mx-auto max-w-3xl px-6 py-10">
                    <div className="rounded-3xl border border-zinc-200 bg-white p-10 text-center sm:p-14">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-zinc-900 text-3xl text-white">
                            ✓
                        </div>

                        <p className="mt-8 text-sm font-medium uppercase tracking-wider text-zinc-400">
                            Lesson complete
                        </p>

                        <h1 className="mt-2 text-4xl font-bold tracking-tight text-zinc-900">
                            {lessonTitle}
                        </h1>

                        <div className="mx-auto mt-8 grid max-w-lg grid-cols-3 gap-3">
                            <div className="rounded-2xl bg-zinc-50 p-5">
                                <p className="text-2xl font-bold text-zinc-900">
                                    {
                                        correctAnswers
                                    }
                                </p>

                                <p className="mt-1 text-xs text-zinc-500">
                                    Correct
                                </p>
                            </div>

                            <div className="rounded-2xl bg-zinc-50 p-5">
                                <p className="text-2xl font-bold text-zinc-900">
                                    {
                                        incorrectAnswers
                                    }
                                </p>

                                <p className="mt-1 text-xs text-zinc-500">
                                    Incorrect
                                </p>
                            </div>

                            <div className="rounded-2xl bg-zinc-900 p-5 text-white">
                                <p className="text-2xl font-bold">
                                    {
                                        percentage
                                    }
                                    %
                                </p>

                                <p className="mt-1 text-xs text-zinc-400">
                                    Score
                                </p>
                            </div>
                        </div>

                        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
                            <a
                                href="/dashboard"
                                className="rounded-2xl bg-zinc-900 px-6 py-3 font-semibold text-white transition hover:bg-zinc-800"
                            >
                                Back to dashboard
                            </a>

                            <a
                                href="/courses"
                                className="rounded-2xl border border-zinc-200 bg-white px-6 py-3 font-semibold text-zinc-900 transition hover:bg-zinc-50"
                            >
                                Browse courses
                            </a>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <ExerciseShell
            current={
                currentIndex + 1
            }
            total={activities.length}
            lessonTitle={lessonTitle}
            canContinue={answered}
            onContinue={
                continueLesson
            }
        >
            {currentActivity.type ===
                "flashcard" && (
                    <Flashcard
                        front={
                            currentActivity.front ??
                            ""
                        }
                        back={
                            currentActivity.back ??
                            ""
                        }
                        pronunciation={
                            currentActivity.pronunciation
                        }
                        example={
                            currentActivity.example
                        }
                    />
                )}

            {currentActivity.type ===
                "multiple_choice" && (
                    <MultipleChoice
                        question={
                            currentActivity.question ??
                            ""
                        }
                        options={
                            currentActivity.options ??
                            []
                        }
                        correctAnswer={
                            currentActivity.correctAnswer ??
                            ""
                        }
                        onAnswer={(
                            correct,
                        ) =>
                            handleAnswer(
                                correct,
                            )
                        }
                    />
                )}

            {currentActivity.type ===
                "translation" && (
                    <TranslationExercise
                        question={
                            currentActivity.question ??
                            ""
                        }
                        correctAnswers={
                            currentActivity.correctAnswers ??
                            (currentActivity.correctAnswer
                                ? [
                                    currentActivity.correctAnswer,
                                ]
                                : [])
                        }
                        onAnswer={(
                            correct,
                        ) =>
                            handleAnswer(
                                correct,
                            )
                        }
                    />
                )}

            {currentActivity.type ===
                "flashcard" && (
                    <Flashcard
                        front={
                            currentActivity.front ??
                            ""
                        }
                        back={
                            currentActivity.back ??
                            ""
                        }
                        pronunciation={
                            currentActivity.pronunciation
                        }
                        example={
                            currentActivity.example
                        }
                        onReviewed={() =>
                            setAnswered(true)
                        }
                    />
                )}
        </ExerciseShell>
    );
}