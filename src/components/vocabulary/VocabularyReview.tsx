"use client";

import { useMemo, useState } from "react";

interface VocabularyItem {
    id: number;
    word: string;
    translation: string;
    pronunciation?: string | null;
    example?: string | null;
    audioUrl?: string | null;
}

interface VocabularyReviewProps {
    items: VocabularyItem[];
    onComplete?: (
        results: VocabularyReviewResult,
    ) => void;
}

export interface VocabularyReviewResult {
    total: number;
    known: number;
    learning: number;
}

export default function VocabularyReview({
                                             items,
                                             onComplete,
                                         }: VocabularyReviewProps) {
    const [index, setIndex] =
        useState(0);

    const [revealed, setRevealed] =
        useState(false);

    const [known, setKnown] =
        useState(0);

    const [learning, setLearning] =
        useState(0);

    const [finished, setFinished] =
        useState(false);

    const current =
        items[index];

    const percentage =
        useMemo(() => {
            if (items.length === 0) {
                return 0;
            }

            return Math.round(
                ((index + 1) /
                    items.length) *
                100,
            );
        }, [
            index,
            items.length,
        ]);

    function answer(
        knew: boolean,
    ) {
        if (!revealed) {
            return;
        }

        if (knew) {
            setKnown(
                (value) => value + 1,
            );
        } else {
            setLearning(
                (value) => value + 1,
            );
        }

        if (index === items.length - 1) {
            const result: VocabularyReviewResult =
                {
                    total: items.length,
                    known:
                        known +
                        (knew ? 1 : 0),
                    learning:
                        learning +
                        (knew ? 0 : 1),
                };

            setFinished(true);

            onComplete?.(result);

            return;
        }

        setIndex(
            (value) => value + 1,
        );

        setRevealed(false);
    }

    if (items.length === 0) {
        return (
            <div className="rounded-3xl border border-zinc-200 bg-white p-10 text-center">
                <h2 className="text-xl font-bold text-zinc-900">
                    No vocabulary to review
                </h2>

                <p className="mt-2 text-sm text-zinc-500">
                    There are no words available for
                    review right now.
                </p>
            </div>
        );
    }

    if (finished) {
        return (
            <div className="rounded-3xl border border-zinc-200 bg-white p-10 text-center sm:p-14">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-zinc-900 text-3xl text-white">
                    ✓
                </div>

                <p className="mt-8 text-sm font-medium uppercase tracking-wider text-zinc-400">
                    Review complete
                </p>

                <h2 className="mt-2 text-4xl font-bold tracking-tight text-zinc-900">
                    Nice work
                </h2>

                <div className="mx-auto mt-8 grid max-w-lg grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-zinc-50 p-5">
                        <p className="text-3xl font-bold text-zinc-900">
                            {known}
                        </p>

                        <p className="mt-1 text-sm text-zinc-500">
                            I knew it
                        </p>
                    </div>

                    <div className="rounded-2xl bg-zinc-50 p-5">
                        <p className="text-3xl font-bold text-zinc-900">
                            {learning}
                        </p>

                        <p className="mt-1 text-sm text-zinc-500">
                            Still learning
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-zinc-900">
                    Vocabulary review
                </span>

                <span className="text-zinc-500">
                    {index + 1} /{" "}
                    {items.length}
                </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100">
                <div
                    className="h-full rounded-full bg-zinc-900 transition-all"
                    style={{
                        width: `${percentage}%`,
                    }}
                />
            </div>

            <div className="mt-8 rounded-3xl border border-zinc-200 bg-zinc-50 p-8 text-center sm:p-12">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400">
                    Word
                </p>

                <h2 className="mt-6 text-5xl font-bold tracking-tight text-zinc-900">
                    {current.word}
                </h2>

                {current.pronunciation && (
                    <p className="mt-4 text-lg text-zinc-500">
                        {current.pronunciation}
                    </p>
                )}

                {current.audioUrl && (
                    <button
                        type="button"
                        onClick={() => {
                            const audio =
                                new Audio(
                                    current.audioUrl!,
                                );

                            void audio.play();
                        }}
                        className="mt-5 rounded-full border border-zinc-200 bg-white px-5 py-2 text-sm font-medium text-zinc-700"
                    >
                        🔊 Listen
                    </button>
                )}

                {!revealed ? (
                    <button
                        type="button"
                        onClick={() =>
                            setRevealed(
                                true,
                            )
                        }
                        className="mt-10 rounded-2xl bg-zinc-900 px-7 py-3 font-semibold text-white"
                    >
                        Show meaning
                    </button>
                ) : (
                    <>
                        <div className="mt-8 rounded-2xl bg-white p-5">
                            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                                Meaning
                            </p>

                            <p className="mt-2 text-2xl font-bold text-zinc-900">
                                {
                                    current.translation
                                }
                            </p>

                            {current.example && (
                                <p className="mt-4 text-sm leading-6 text-zinc-500">
                                    {
                                        current.example
                                    }
                                </p>
                            )}
                        </div>

                        <div className="mt-8 grid gap-3 sm:grid-cols-2">
                            <button
                                type="button"
                                onClick={() =>
                                    answer(
                                        false,
                                    )
                                }
                                className="rounded-2xl border border-zinc-200 bg-white px-5 py-4 font-semibold text-zinc-900 transition hover:border-zinc-900"
                            >
                                Still learning
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    answer(
                                        true,
                                    )
                                }
                                className="rounded-2xl bg-zinc-900 px-5 py-4 font-semibold text-white transition hover:bg-zinc-800"
                            >
                                I knew it
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}