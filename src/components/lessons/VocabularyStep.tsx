"use client";

import type {
    LessonWord,
} from "@/lib/lesson";

interface VocabularyStepProps {
    word: LessonWord;
    index: number;
    total: number;
    onContinue: () => void;
}

export default function VocabularyStep({
                                           word,
                                           index,
                                           total,
                                           onContinue,
                                       }: VocabularyStepProps) {
    return (
        <div className="mx-auto w-full max-w-3xl">
            <div className="mb-8">
                <p className="text-sm font-medium uppercase tracking-wider text-zinc-400">
                    Vocabulary
                </p>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-200">
                    <div
                        className="h-full rounded-full bg-zinc-900 transition-all"
                        style={{
                            width: `${
                                ((index + 1) /
                                    total) *
                                100
                            }%`,
                        }}
                    />
                </div>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm sm:p-12">
                <p className="text-sm text-zinc-400">
                    {index + 1} of{" "}
                    {total}
                </p>

                <h1 className="mt-8 text-5xl font-bold tracking-tight text-zinc-900">
                    {word.vocabulary.word}
                </h1>

                {word.vocabulary
                    .pronunciation && (
                    <p className="mt-3 text-zinc-400">
                        {
                            word
                                .vocabulary
                                .pronunciation
                        }
                    </p>
                )}

                <p className="mt-8 text-2xl font-medium text-zinc-600">
                    {word.translation}
                </p>

                {word.vocabulary
                    .definition && (
                    <p className="mx-auto mt-6 max-w-xl leading-7 text-zinc-500">
                        {
                            word
                                .vocabulary
                                .definition
                        }
                    </p>
                )}

                {word.vocabulary
                    .partOfSpeech && (
                    <p className="mt-5 text-xs font-medium uppercase tracking-wider text-zinc-400">
                        {
                            word
                                .vocabulary
                                .partOfSpeech
                        }
                    </p>
                )}

                <button
                    type="button"
                    onClick={onContinue}
                    className="mt-10 w-full rounded-2xl bg-zinc-900 px-6 py-4 font-semibold text-white transition hover:bg-zinc-800"
                >
                    Continue →
                </button>
            </div>
        </div>
    );
}