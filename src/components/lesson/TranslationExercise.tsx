"use client";

import {
    useState,
} from "react";

interface TranslationExerciseProps {
    question: string;
    placeholder?: string;
    correctAnswers: string[];
    onAnswer?: (
        correct: boolean,
        answer: string,
    ) => void;
}

export default function TranslationExercise({
                                                question,
                                                placeholder = "Type your answer...",
                                                correctAnswers,
                                                onAnswer,
                                            }: TranslationExerciseProps) {
    const [answer, setAnswer] =
        useState("");

    const [submitted, setSubmitted] =
        useState(false);

    const [correct, setCorrect] =
        useState(false);

    function normalize(
        value: string,
    ) {
        return value
            .trim()
            .toLowerCase()
            .replace(/[.!?,]/g, "");
    }

    function submit() {
        if (
            submitted ||
            !answer.trim()
        ) {
            return;
        }

        const normalizedAnswer =
            normalize(answer);

        const isCorrect =
            correctAnswers.some(
                (expected) =>
                    normalize(
                        expected,
                    ) ===
                    normalizedAnswer,
            );

        setCorrect(isCorrect);
        setSubmitted(true);

        onAnswer?.(
            isCorrect,
            answer,
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
                {question}
            </h2>

            <div className="mt-8">
                <textarea
                    value={answer}
                    onChange={(event) =>
                        setAnswer(
                            event.target.value,
                        )
                    }
                    disabled={submitted}
                    placeholder={placeholder}
                    rows={4}
                    className="w-full resize-none rounded-2xl border border-zinc-200 bg-white p-5 text-lg text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 disabled:bg-zinc-50"
                />

                <button
                    type="button"
                    onClick={submit}
                    disabled={
                        submitted ||
                        !answer.trim()
                    }
                    className="mt-4 rounded-2xl bg-zinc-900 px-6 py-3 font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Check answer
                </button>
            </div>

            {submitted && (
                <div
                    className={`mt-6 rounded-2xl p-5 ${
                        correct
                            ? "bg-green-50 text-green-800"
                            : "bg-red-50 text-red-800"
                    }`}
                >
                    <p className="font-semibold">
                        {correct
                            ? "Correct!"
                            : "Not quite."}
                    </p>

                    {!correct && (
                        <p className="mt-2 text-sm">
                            Accepted answer:{" "}
                            {
                                correctAnswers[0]
                            }
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}