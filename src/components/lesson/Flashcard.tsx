"use client";

import { useState } from "react";

interface FlashcardProps {
    front: string;
    back: string;
    pronunciation?: string | null;
    example?: string | null;
    onReviewed?: () => void;
}

export default function Flashcard({
                                      front,
                                      back,
                                      pronunciation,
                                      example,
                                      onReviewed,
                                  }: FlashcardProps) {
    const [flipped, setFlipped] =
        useState(false);

    function flip() {
        const next =
            !flipped;

        setFlipped(next);

        if (next) {
            onReviewed?.();
        }
    }

    return (
        <button
            type="button"
            onClick={flip}
            className="group w-full text-left"
            aria-label={
                flipped
                    ? "Show front of flashcard"
                    : "Show back of flashcard"
            }
        >
            <div className="relative min-h-[360px] w-full rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm transition hover:shadow-md sm:p-12">
                {!flipped ? (
                    <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400">
                            Word
                        </p>

                        <h2 className="mt-6 text-5xl font-bold tracking-tight text-zinc-900">
                            {front}
                        </h2>

                        {pronunciation && (
                            <p className="mt-5 text-lg text-zinc-500">
                                {pronunciation}
                            </p>
                        )}

                        <p className="mt-10 text-sm text-zinc-400">
                            Click to reveal
                        </p>
                    </div>
                ) : (
                    <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400">
                            Meaning
                        </p>

                        <h2 className="mt-6 text-4xl font-bold tracking-tight text-zinc-900">
                            {back}
                        </h2>

                        {example && (
                            <p className="mt-6 max-w-lg text-base leading-7 text-zinc-500">
                                {example}
                            </p>
                        )}

                        <p className="mt-10 text-sm text-zinc-400">
                            Click to see the word
                        </p>
                    </div>
                )}
            </div>
        </button>
    );
}