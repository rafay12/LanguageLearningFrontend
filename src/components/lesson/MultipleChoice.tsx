"use client";

import { useState } from "react";

interface MultipleChoiceProps {
    question: string;
    options: string[];
    correctAnswer: string;
    onAnswer?: (
        correct: boolean,
        answer: string,
    ) => void;
}

export default function MultipleChoice({
                                           question,
                                           options,
                                           correctAnswer,
                                           onAnswer,
                                       }: MultipleChoiceProps) {
    const [selected, setSelected] =
        useState<string | null>(null);

    const answered =
        selected !== null;

    function choose(
        option: string,
    ) {
        if (answered) {
            return;
        }

        setSelected(option);

        onAnswer?.(
            option === correctAnswer,
            option,
        );
    }

    function getClassName(
        option: string,
    ) {
        if (!answered) {
            return "border-zinc-200 bg-white hover:border-zinc-900 hover:bg-zinc-50";
        }

        if (option === correctAnswer) {
            return "border-green-300 bg-green-50 text-green-900";
        }

        if (option === selected) {
            return "border-red-300 bg-red-50 text-red-900";
        }

        return "border-zinc-200 bg-zinc-50 text-zinc-400";
    }

    return (
        <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
                {question}
            </h2>

            <div className="mt-8 space-y-3">
                {options.map(
                    (
                        option,
                        index,
                    ) => (
                        <button
                            key={`${option}-${index}`}
                            type="button"
                            onClick={() =>
                                choose(
                                    option,
                                )
                            }
                            disabled={
                                answered
                            }
                            className={`flex w-full items-center gap-4 rounded-2xl border p-5 text-left transition ${getClassName(
                                option,
                            )}`}
                        >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-sm font-bold text-zinc-600">
                                {String.fromCharCode(
                                    65 +
                                    index,
                                )}
                            </span>

                            <span className="font-medium">
                                {option}
                            </span>

                            {answered &&
                                option ===
                                correctAnswer && (
                                    <span className="ml-auto font-bold text-green-600">
                                        ✓
                                    </span>
                                )}

                            {answered &&
                                option ===
                                selected &&
                                option !==
                                correctAnswer && (
                                    <span className="ml-auto font-bold text-red-600">
                                        ×
                                    </span>
                                )}
                        </button>
                    ),
                )}
            </div>

            {answered && (
                <div
                    className={`mt-6 rounded-2xl p-4 text-sm ${
                        selected ===
                        correctAnswer
                            ? "bg-green-50 text-green-800"
                            : "bg-red-50 text-red-800"
                    }`}
                >
                    {selected ===
                    correctAnswer
                        ? "Correct!"
                        : `Not quite. The correct answer is ${correctAnswer}.`}
                </div>
            )}
        </div>
    );
}