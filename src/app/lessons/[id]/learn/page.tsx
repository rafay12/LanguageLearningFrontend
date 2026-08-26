"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { api } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import ProtectedRoute from "@/components/ProtectedRoute";

interface Lesson {
    id: number;
    title: string;
    description?: string | null;
    number?: number | null;
    unitId: number;
    type?: string | null;
}

interface LessonVocabularyLink {
    id: number;
    lessonId: number;
    vocabularyId: number;
    position?: number | null;
    isRequired?: boolean | null;
}

interface Vocabulary {
    id: number;
    languageId: number;
    word: string;
    normalizedWord?: string | null;
    partOfSpeech?: string | null;
    definition?: string | null;
}

interface VocabularyTranslation {
    id: number;
    vocabularyId: number;
    languageId: number;
    translation: string;
    normalizedTranslation?: string | null;
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
    email?: string;
    username?: string;
    name?: string;
}

type QuestionType = "translation" | "multiple-choice";

interface LessonWord {
    vocabulary: Vocabulary;
    translation: string;
}

interface Question {
    item: LessonWord;
    type: QuestionType;
    options: string[];
    answer: string;
}

export default function LessonLearnPage() {
    const params = useParams();
    const router = useRouter();

    const lessonId = Number(params.id);

    const [user, setUser] = useState<User | null>(null);

    const [lesson, setLesson] = useState<Lesson | null>(null);

    const [words, setWords] = useState<LessonWord[]>([]);

    const [currentIndex, setCurrentIndex] = useState(0);

    const [answer, setAnswer] = useState("");

    const [selectedAnswer, setSelectedAnswer] =
        useState<string | null>(null);

    const [submitted, setSubmitted] = useState(false);

    const [correct, setCorrect] = useState(false);

    const [score, setScore] = useState(0);

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");

    const [completed, setCompleted] = useState(false);

    const [alreadyCompleted, setAlreadyCompleted] =
        useState(false);

    /*
     * Load the lesson and its vocabulary.
     */
    useEffect(() => {
        if (!Number.isFinite(lessonId)) {
            setError("Invalid lesson ID.");
            setLoading(false);
            return;
        }

        let cancelled = false;

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
                    getCurrentUser(),
                ]);

                if (cancelled) {
                    return;
                }

                setLesson(lessonData);
                setUser(currentUser);

                /*
                 * Get the vocabulary links belonging
                 * to this lesson.
                 */
                const links =
                    await api<LessonVocabularyLink[]>(
                        `/lesson-vocabulary/lesson/${lessonId}`,
                    );

                if (cancelled) {
                    return;
                }

                /*
                 * Keep lesson vocabulary in the
                 * position supplied by the backend.
                 */
                const sortedLinks = [
                    ...links,
                ].sort(
                    (a, b) =>
                        (a.position ?? 0) -
                        (b.position ?? 0),
                );

                /*
                 * Load every vocabulary record and
                 * its translations.
                 */
                const lessonWords =
                    await Promise.all(
                        sortedLinks.map(
                            async (link) => {
                                const [
                                    vocabulary,
                                    translations,
                                ] =
                                    await Promise.all([
                                        api<Vocabulary>(
                                            `/vocabulary/${link.vocabularyId}`,
                                        ),
                                        api<
                                            VocabularyTranslation[]
                                        >(
                                            `/vocabulary/${link.vocabularyId}/translations`,
                                        ),
                                    ]);

                                /*
                                 * Every seeded vocabulary
                                 * word currently has a
                                 * translation.
                                 */
                                const translation =
                                    translations[0]
                                        ?.translation ??
                                    "";

                                return {
                                    vocabulary,
                                    translation,
                                };
                            },
                        ),
                    );

                if (cancelled) {
                    return;
                }

                /*
                 * Remove any incomplete records.
                 */
                const usableWords =
                    lessonWords.filter(
                        (item) =>
                            item.vocabulary
                                ?.word &&
                            item.translation,
                    );

                setWords(usableWords);

                /*
                 * Check existing progress.
                 *
                 * The backend exposes progress by
                 * user, so we fetch the user's records
                 * and locate this lesson.
                 */
                try {
                    const progress =
                        await api<
                            LessonProgress[]
                        >(
                            `/lesson-progress/user/${currentUser.id}`,
                        );

                    const currentProgress =
                        progress.find(
                            (item) =>
                                item.lessonId ===
                                lessonId,
                        );

                    if (
                        currentProgress
                            ?.status ===
                        "COMPLETED" ||
                        currentProgress?.completedAt
                    ) {
                        setAlreadyCompleted(true);

                        setScore(
                            Number(
                                currentProgress
                                    .score ??
                                0,
                            ),
                        );
                    }
                } catch (progressError) {
                    /*
                     * Progress is not required to
                     * display the lesson.
                     */
                    console.warn(
                        "Could not load lesson progress:",
                        progressError,
                    );
                }

                /*
                 * Start/resume the lesson.
                 *
                 * The backend handles the authenticated
                 * user from the JWT.
                 */
                try {
                    await api(
                        `/lesson-progress/${lessonId}/start`,
                        {
                            method: "POST",
                        },
                    );
                } catch (startError) {
                    console.warn(
                        "Could not start lesson:",
                        startError,
                    );
                }
            } catch (err) {
                console.error(
                    "Failed to load lesson:",
                    err,
                );

                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Unable to load lesson.",
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadLesson();

        return () => {
            cancelled = true;
        };
    }, [lessonId]);

    /*
     * Current vocabulary item.
     */
    const currentWord =
        words[currentIndex];

    /*
     * Build the question.
     *
     * Every third question is multiple choice.
     * The other questions require typed answers.
     */
    const question = useMemo<Question | null>(() => {
        if (!currentWord) {
            return null;
        }

        const isMultipleChoice =
            currentIndex % 3 === 2;

        if (!isMultipleChoice) {
            return {
                item: currentWord,
                type: "translation",
                options: [],
                answer:
                currentWord.translation,
            };
        }

        /*
         * Get wrong answers from other words.
         */
        const wrongAnswers =
            words
                .filter(
                    (_, index) =>
                        index !==
                        currentIndex,
                )
                .map(
                    (item) =>
                        item.translation,
                )
                .filter(
                    (translation) =>
                        translation !==
                        currentWord.translation,
                );

        /*
         * Select up to three wrong answers.
         *
         * Using a deterministic rotation instead
         * of Math.random() prevents the options
         * from changing during React renders.
         */
        const selectedWrongAnswers: string[] =
            [];

        for (
            let offset = 1;
            offset <= words.length &&
            selectedWrongAnswers.length <
            3;
            offset++
        ) {
            const index =
                (currentIndex +
                    offset) %
                words.length;

            const candidate =
                words[index]?.translation;

            if (
                candidate &&
                candidate !==
                currentWord.translation &&
                !selectedWrongAnswers.includes(
                    candidate,
                )
            ) {
                selectedWrongAnswers.push(
                    candidate,
                );
            }
        }

        /*
         * If there aren't enough unique choices,
         * use the available wrong answers.
         */
        for (
            const candidate of wrongAnswers
            ) {
            if (
                selectedWrongAnswers.length >=
                3
            ) {
                break;
            }

            if (
                !selectedWrongAnswers.includes(
                    candidate,
                )
            ) {
                selectedWrongAnswers.push(
                    candidate,
                );
            }
        }

        const options = [
            currentWord.translation,
            ...selectedWrongAnswers,
        ];

        /*
         * Stable shuffle based on the question
         * index.
         */
        const shuffled = [...options];

        for (
            let i = shuffled.length - 1;
            i > 0;
            i--
        ) {
            const j =
                (currentIndex * 7 +
                    i * 3) %
                (i + 1);

            [
                shuffled[i],
                shuffled[j],
            ] = [
                shuffled[j],
                shuffled[i],
            ];
        }

        return {
            item: currentWord,
            type: "multiple-choice",
            options: shuffled,
            answer:
            currentWord.translation,
        };
    }, [words, currentIndex, currentWord]);

    /*
     * Lesson progress.
     */
    const progressPercent =
        words.length > 0
            ? Math.round(
                (currentIndex /
                    words.length) *
                100,
            )
            : 0;

    /*
     * Normalize text so:
     *
     * "Sí"
     *
     * matches:
     *
     * "si"
     */
    function normalize(
        value: string,
    ): string {
        return value
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                "",
            );
    }

    /*
     * Check the current answer.
     */
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

        setSubmitted(true);

        /*
         * Only update score once.
         */
        if (isCorrect) {
            setScore(
                (currentScore) =>
                    currentScore + 1,
            );
        }
    }

    /*
     * Save progress to the backend.
     */
    async function saveProgress(
        percent: number,
        currentScore: number,
    ) {
        try {
            setSaving(true);

            await api(
                `/lesson-progress/${lessonId}/progress`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        progress: Math.max(
                            0,
                            Math.min(
                                100,
                                Math.round(
                                    percent,
                                ),
                            ),
                        ),
                        score: Math.max(
                            0,
                            Math.round(
                                currentScore,
                            ),
                        ),
                    }),
                },
            );
        } catch (err) {
            console.error(
                "Failed to save lesson progress:",
                err,
            );
        } finally {
            setSaving(false);
        }
    }

    /*
     * Finish the lesson.
     */
    async function completeLesson(
        finalScore: number,
    ) {
        try {
            setSaving(true);

            /*
             * First save the final score.
             */
            await api(
                `/lesson-progress/${lessonId}/progress`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        progress: 100,
                        score: finalScore,
                    }),
                },
            );

            /*
             * Then mark it completed.
             */
            await api(
                `/lesson-progress/${lessonId}/complete`,
                {
                    method: "POST",
                },
            );

            setCompleted(true);
        } catch (err) {
            console.error(
                "Failed to complete lesson:",
                err,
            );

            setError(
                "Your final progress could not be saved. Please try again.",
            );
        } finally {
            setSaving(false);
        }
    }

    /*
     * Go to the next question.
     */
    async function nextQuestion() {
        if (!submitted || !question) {
            return;
        }

        /*
         * IMPORTANT:
         *
         * React state updates are asynchronous.
         *
         * If the current answer was correct,
         * `score` may still contain the old value.
         *
         * Therefore calculate the final score
         * explicitly.
         */
        const finalScore =
            score + (correct ? 1 : 0);

        const nextIndex =
            currentIndex + 1;

        /*
         * Last question.
         */
        if (
            nextIndex >=
            words.length
        ) {
            await completeLesson(
                finalScore,
            );

            return;
        }

        /*
         * Save progress before moving forward.
         */
        const percent =
            Math.round(
                (nextIndex /
                    words.length) *
                100,
            );

        await saveProgress(
            percent,
            finalScore,
        );

        /*
         * Move to next word.
         */
        setScore(finalScore);

        setCurrentIndex(
            nextIndex,
        );

        setAnswer("");

        setSelectedAnswer(null);

        setSubmitted(false);

        setCorrect(false);
    }

    /*
     * Leave the lesson.
     */
    async function exitLesson() {
        /*
         * Save current position.
         */
        await saveProgress(
            progressPercent,
            score,
        );

        router.push("/dashboard");
    }

    /*
     * Loading state.
     */
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

    /*
     * Error state.
     */
    if (error && !lesson) {
        return (
            <ProtectedRoute>
                <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
                    <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-xl text-red-600">
                            !
                        </div>

                        <h1 className="mt-5 text-xl font-bold">
                            Unable to load lesson
                        </h1>

                        <p className="mt-2 text-sm leading-6 text-zinc-500">
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

    /*
     * No lesson.
     */
    if (!lesson) {
        return null;
    }

    /*
     * No vocabulary.
     */
    if (words.length === 0) {
        return (
            <ProtectedRoute>
                <main className="min-h-screen bg-zinc-50">
                    <header className="border-b border-zinc-200 bg-white">
                        <div className="mx-auto flex h-16 max-w-4xl items-center px-6">
                            <Link
                                href="/dashboard"
                                className="text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
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

                        <p className="mx-auto mt-2 max-w-md text-zinc-500">
                            This lesson does not
                            have any vocabulary
                            available yet.
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

    /*
     * Completion screen.
     */
    if (completed) {
        const finalPercentage =
            words.length > 0
                ? Math.round(
                    (score /
                        words.length) *
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

                        <p className="mt-7 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
                            Lesson complete
                        </p>

                        <h1 className="mt-2 text-3xl font-bold tracking-tight">
                            Great work!
                        </h1>

                        <p className="mt-3 text-zinc-500">
                            You completed{" "}
                            <strong className="text-zinc-700">
                                {lesson.title}
                            </strong>
                            .
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
                                    {score}/
                                    {
                                        words.length
                                    }
                                </p>

                                <p className="mt-1 text-xs text-zinc-400">
                                    Correct
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Link
                                href="/dashboard"
                                className="flex-1 rounded-xl border border-zinc-200 px-5 py-3 text-sm font-semibold transition hover:bg-zinc-50"
                            >
                                Dashboard
                            </Link>

                            <button
                                type="button"
                                onClick={() => {
                                    setCurrentIndex(
                                        0,
                                    );
                                    setScore(0);
                                    setAnswer("");
                                    setSelectedAnswer(
                                        null,
                                    );
                                    setSubmitted(
                                        false,
                                    );
                                    setCorrect(
                                        false,
                                    );
                                    setCompleted(
                                        false,
                                    );
                                    setAlreadyCompleted(
                                        false,
                                    );
                                }}
                                className="flex-1 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
                            >
                                Practice again
                            </button>
                        </div>
                    </div>
                </main>
            </ProtectedRoute>
        );
    }

    /*
     * Current question should always exist when
     * vocabulary exists.
     */
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
                                disabled={
                                    saving
                                }
                                aria-label="Exit lesson"
                                className="text-2xl font-light text-zinc-400 transition hover:text-zinc-900 disabled:opacity-40"
                            >
                                ×
                            </button>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-4 text-xs">
                                    <span className="truncate font-medium text-zinc-500">
                                        {
                                            lesson.title
                                        }
                                    </span>

                                    <span className="shrink-0 text-zinc-400">
                                        {currentIndex +
                                            1}{" "}
                                        /{" "}
                                        {
                                            words.length
                                        }
                                    </span>
                                </div>

                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
                                    <div
                                        className="h-full rounded-full bg-zinc-900 transition-all duration-300"
                                        style={{
                                            width: `${Math.max(
                                                4,
                                                Math.round(
                                                    ((currentIndex +
                                                            (submitted
                                                                ? 1
                                                                : 0)) /
                                                        words.length) *
                                                    100,
                                                ),
                                            )}%`,
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="shrink-0 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-600">
                                {score} pts
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main lesson area */}
                <div className="mx-auto max-w-2xl px-6 py-10 sm:py-14">
                    {/* Question label */}
                    <div className="text-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
                            {question.type ===
                            "multiple-choice"
                                ? "Choose the translation"
                                : "Translate this word"}
                        </p>

                        {/* Word card */}
                        <div className="mt-8 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-12">
                            <p className="text-4xl font-bold tracking-tight sm:text-5xl">
                                {
                                    question
                                        .item
                                        .vocabulary
                                        .word
                                }
                            </p>

                            {question
                                .item
                                .vocabulary
                                .partOfSpeech && (
                                <p className="mt-3 text-xs font-medium uppercase tracking-widest text-zinc-400">
                                    {
                                        question
                                            .item
                                            .vocabulary
                                            .partOfSpeech
                                    }
                                    )}
                                </div>
                                </div>

                            {/* Answer section */}
                            <div className="mt-8">
                                {question.type ===
                                "multiple-choice" ? (
                                    <div className="space-y-3">
                                        {question.options.map(
                                            (
                                                option,
                                                index,
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
                                                    option !==
                                                    question.answer;

                                                return (
                                                    <button
                                                        key={`${option}-${index}`}
                                                        type="button"
                                                        disabled={
                                                            submitted ||
                                                            saving
                                                        }
                                                        onClick={() =>
                                                            setSelectedAnswer(
                                                                option,
                                                            )
                                                        }
                                                        className={[
                                                            "w-full rounded-2xl border p-4 text-left font-medium transition-all",
                                                            isCorrectOption
                                                                ? "border-zinc-900 bg-zinc-900 text-white"
                                                                : isWrongSelection
                                                                    ? "border-red-300 bg-red-50 text-red-700"
                                                                    : isSelected
                                                                        ? "border-zinc-900 bg-zinc-100 text-zinc-900"
                                                                        : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-400 hover:bg-zinc-50",
                                                        ].join(
                                                            " ",
                                                        )}
                                                    >
                                                <span className="flex items-center gap-4">
                                                    <span
                                                        className={[
                                                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                                                            isCorrectOption
                                                                ? "bg-white/15 text-white"
                                                                : isWrongSelection
                                                                    ? "bg-red-100 text-red-600"
                                                                    : isSelected
                                                                        ? "bg-zinc-900 text-white"
                                                                        : "bg-zinc-100 text-zinc-500",
                                                        ].join(
                                                            " ",
                                                        )}
                                                    >
                                                        {String.fromCharCode(
                                                            65 +
                                                            index,
                                                        )}
                                                    </span>

                                                    <span>
                                                        {
                                                            option
                                                        }
                                                    </span>
                                                </span>
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
                                            submitted ||
                                            saving
                                        }
                                        placeholder="Type your answer..."
                                        autoFocus
                                        className="w-full rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-lg outline-none transition placeholder:text-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 disabled:bg-zinc-50"
                                    />
                                )}
                            </div>

                            {/* Answer feedback */}
                            {submitted && (
                                <div
                                    className={[
                                        "mt-5 rounded-2xl p-5",
                                        correct
                                            ? "bg-zinc-900 text-white"
                                            : "border border-red-200 bg-red-50 text-red-800",
                                    ].join(
                                        " ",
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={[
                                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                                                correct
                                                    ? "bg-white/10 text-white"
                                                    : "bg-red-100 text-red-600",
                                            ].join(
                                                " ",
                                            )}
                                        >
                                            {correct
                                                ? "✓"
                                                : "!"}
                                        </div>

                                        <div>
                                            <p className="font-bold">
                                                {correct
                                                    ? "Correct!"
                                                    : "Not quite."}
                                            </p>

                                            {!correct && (
                                                <p className="mt-1 text-sm opacity-80">
                                                    Correct
                                                    answer:{" "}
                                                    <strong>
                                                        {
                                                            question.answer
                                                        }
                                                    </strong>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Action button */}
                            <div className="mt-6">
                                {!submitted ? (
                                    <button
                                        type="button"
                                        onClick={
                                            submitAnswer
                                        }
                                        disabled={
                                            saving ||
                                            (question.type ===
                                            "multiple-choice"
                                                ? !selectedAnswer
                                                : !answer.trim())
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
                                        className="w-full rounded-2xl bg-zinc-900 px-6 py-4 font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {saving
                                            ? "Saving..."
                                            : currentIndex +
                                            1 >=
                                            words.length
                                                ? "Finish lesson"
                                                : "Continue →"}
                                    </button>
                                )}
                            </div>

                            {/* Existing completion notice */}
                            {alreadyCompleted &&
                                currentIndex ===
                                0 &&
                                !submitted && (
                                    <p className="mt-5 text-center text-xs text-zinc-400">
                                        You have completed
                                        this lesson before.
                                        You can practice it
                                        again.
                                    </p>
                                )}
                        </div>
            </main>
        </ProtectedRoute>
);
}