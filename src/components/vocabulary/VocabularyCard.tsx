"use client";

import { useState } from "react";

interface VocabularyCardProps {
    word: string;
    translation: string;
    pronunciation?: string | null;
    partOfSpeech?: string | null;
    example?: string | null;
    audioUrl?: string | null;
}

export default function VocabularyCard({
                                           word,
                                           translation,
                                           pronunciation,
                                           partOfSpeech,
                                           example,
                                           audioUrl,
                                       }: VocabularyCardProps) {
    const [showTranslation, setShowTranslation] =
        useState(false);

    function playAudio() {
        if (!audioUrl) {
            return;
        }

        const audio = new Audio(audioUrl);
        void audio.play();
    }

    return (
        <article className="rounded-3xl border border-zinc-200 bg-white p-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    {partOfSpeech && (
                        <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                            {partOfSpeech}
                        </p>
                    )}

                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
                        {word}
                    </h2>

                    {pronunciation && (
                        <p className="mt-2 text-sm text-zinc-500">
                            {pronunciation}
                        </p>
                    )}
                </div>

                {audioUrl && (
                    <button
                        type="button"
                        onClick={playAudio}
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 text-lg transition hover:border-zinc-900 hover:bg-zinc-50"
                        aria-label="Play pronunciation"
                    >
                        🔊
                    </button>
                )}
            </div>

            <div className="mt-6 border-t border-zinc-100 pt-5">
                {showTranslation ? (
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                            Translation
                        </p>

                        <p className="mt-2 text-xl font-semibold text-zinc-900">
                            {translation}
                        </p>

                        {example && (
                            <p className="mt-4 rounded-2xl bg-zinc-50 p-4 text-sm leading-6 text-zinc-600">
                                {example}
                            </p>
                        )}
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() =>
                            setShowTranslation(true)
                        }
                        className="w-full rounded-2xl bg-zinc-900 px-5 py-3 font-semibold text-white transition hover:bg-zinc-800"
                    >
                        Show translation
                    </button>
                )}
            </div>
        </article>
    );
}