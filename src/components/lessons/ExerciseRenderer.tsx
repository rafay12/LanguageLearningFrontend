"use client";

import { useState } from "react";

import type {
    Exercise,
} from "@/lib/lesson";

interface ExerciseRendererProps {
    exercise: Exercise;
    disabled?: boolean;
    onSubmit: (
        answer: string,
    ) => void;
}

export default function ExerciseRenderer({
                                             exercise,
                                             disabled = false,
                                             onSubmit,
                                         }: ExerciseRendererProps) {
    const [answer, setAnswer] =
        useState("");

    const [selectedOption, setSelectedOption] =
        useState<string | null>(null);

    function submit() {
        const value =
            exercise.type ===
            "multiple_choice"
                ? selectedOption
                : answer;

        if (!value?.trim()) {
            return;
        }

        onSubmit(value);
    }

    if (
        exercise.type ===
        "multiple_choice"
    ) {
        return (
            <div className="space-y-6">
                <div>
                    <p className="text-sm font-medium uppercase tracking-wider text-zinc-400">
                        Question{" "}
                        {exercise.number}
                    </p>

                    <h2 className="mt-3 text-2xl font-bold text-zinc-900">
                        {exercise.question}
                    </h2>
                </div>

                <div className="grid gap-3">
                    {exercise.options.map(
                        (option) => {
                            const selected =
                                selectedOption ===
                                option.value;

                            return (
                                <button
                                    key={
                                        option.id
                                    }
                                    type="button"
                                    disabled={
                                        disabled
                                    }
                                    onClick={() =>
                                        setSelectedOption(
                                            option.value,
                                        )
                                    }
                                    className={[
                                        "w-full rounded-2xl border p-5 text-left transition",
                                        selected
                                            ? "border-zinc-900 bg-zinc-900 text-white"
                                            : "border-zinc-200 bg-white hover:border-zinc-400",
                                        disabled
                                            ? "cursor-not-allowed opacity-60"
                                            : "",
                                    ].join(
                                        " ",
                                    )}
                                >
                                    <span className="font-semibold">
                                        {option.label ??
                                            option.value}
                                    </span>
                                </button>
                            );
                        },
                    )}
                </div>

                <button
                    type="button"
                    disabled={
                        disabled ||
                        !selectedOption
                    }
                    onClick={submit}
                    className="w-full rounded-2xl bg-zinc-900 px-6 py-4 font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Check answer
                </button>
            </div>
        );
    }

    if (
        exercise.type ===
        "true_false"
    ) {
        return (
            <div className="space-y-6">
                <div>
                    <p className="text-sm font-medium uppercase tracking-wider text-zinc-400">
                        Question{" "}
                        {exercise.number}
                    </p>

                    <h2 className="mt-3 text-2xl font-bold text-zinc-900">
                        {exercise.question}
                    </h2>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    {[
                        "true",
                        "false",
                    ].map(
                        (value) => {
                            const selected =
                                selectedOption ===
                                value;

                            return (
                                <button
                                    key={
                                        value
                                    }
                                    type="button"
                                    disabled={
                                        disabled
                                    }
                                    onClick={() =>
                                        setSelectedOption(
                                            value,
                                        )
                                    }
                                    className={[
                                        "rounded-2xl border p-5 font-semibold capitalize transition",
                                        selected
                                            ? "border-zinc-900 bg-zinc-900 text-white"
                                            : "border-zinc-200 bg-white hover:border-zinc-400",
                                    ].join(
                                        " ",
                                    )}
                                >
                                    {value}
                                </button>
                            );
                        },
                    )}
                </div>

                <button
                    type="button"
                    disabled={
                        disabled ||
                        !selectedOption
                    }
                    onClick={submit}
                    className="w-full rounded-2xl bg-zinc-900 px-6 py-4 font-semibold text-white disabled:opacity-40"
                >
                    Check answer
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <p className="text-sm font-medium uppercase tracking-wider text-zinc-400">
                    Question{" "}
                    {exercise.number}
                </p>

                <h2 className="mt-3 text-2xl font-bold text-zinc-900">
                    {exercise.question}
                </h2>
            </div>

            <input
                type="text"
                value={answer}
                disabled={disabled}
                onChange={(event) =>
                    setAnswer(
                        event.target.value,
                    )
                }
                onKeyDown={(event) => {
                    if (
                        event.key ===
                        "Enter"
                    ) {
                        submit();
                    }
                }}
                placeholder="Type your answer..."
                className="w-full rounded-2xl border border-zinc-300 bg-white px-5 py-4 text-lg outline-none transition focus:border-zinc-900"
            />

            <button
                type="button"
                disabled={
                    disabled ||
                    !answer.trim()
                }
                onClick={submit}
                className="w-full rounded-2xl bg-zinc-900 px-6 py-4 font-semibold text-white disabled:opacity-40"
            >
                Check answer
            </button>
        </div>
    );
}