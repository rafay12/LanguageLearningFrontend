"use client";

import { useState } from "react";

export interface VocabularyItem {
    id: number;
    word: string;
    translation: string;
    pronunciation?: string | null;
    partOfSpeech?: string | null;
}

interface VocabularyIntroductionProps {
    items: VocabularyItem[];
    onComplete: () => void;
}

export default function VocabularyIntroduction({
                                                   items,
                                                   onComplete,
                                               }: VocabularyIntroductionProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (items.length === 0) {
        onComplete();
        return null;
    }

    const current = items[currentIndex];

    const isLast =
        currentIndex === items.length - 1;

    const progress =
        ((currentIndex + 1) / items.length) * 100;

    function next() {
        if (isLast) {
            onComplete();
            return;
        }

        setCurrentIndex((value) => value + 1);
    }

    return (
        <div className="min-h-screen bg-zinc-50">
            <header className="border-b border-zinc-200 bg-white">
                <div className="mx-auto flex h-16 max-w-3xl items-center gap-4 px-6">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
                        <div
                            className="h-full rounded-full bg-zinc-900 transition-all duration-300"
                            style={{
                                width: `${progress}%`,
                            }}
                        />
                    </div>

                    <span className="text-sm text-zinc-500">
                        {currentIndex + 1} / {items.length}
                    </span>
                </div>
            </header>

            <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-3xl items-center px-6 py-12">
                <div className="w-full">
                    <div className="mb-8 text-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
                            Vocabulary
                        </p>

                        <h1 className="mt-3 text-3xl font-bold text-zinc-900">
                            Learn this word
                        </h1>
                    </div>

                    <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-12">
                        <div className="text-center">
                            {current.partOfSpeech && (
                                <p className="mb-4 text-sm italic text-zinc-400">
                                    {current.partOfSpeech}
                                </p>
                            )}

                            <h2 className="text-5xl font-bold tracking-tight text-zinc-900">
                                {current.word}
                            </h2>

                            {current.pronunciation && (
                                <p className="mt-4 text-lg text-zinc-400">
                                    {current.pronunciation}
                                </p>
                            )}

                            <div className="mx-auto my-10 h-px max-w-md bg-zinc-200" />

                            <p className="text-sm uppercase tracking-wider text-zinc-400">
                                Translation
                            </p>

                            <p className="mt-3 text-3xl font-semibold text-zinc-700">
                                {current.translation}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={next}
                            className="mt-12 w-full rounded-2xl bg-zinc-900 px-6 py-4 font-semibold text-white transition hover:bg-zinc-800"
                        >
                            {isLast
                                ? "Start exercises"
                                : "Next word"}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}