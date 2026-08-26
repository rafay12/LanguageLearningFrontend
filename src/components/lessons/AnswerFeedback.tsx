"use client";

import type {
    ExerciseSubmissionResult,
} from "@/lib/lesson";

interface AnswerFeedbackProps {
    result: ExerciseSubmissionResult;
    onNext: () => void;
    loading?: boolean;
}

export default function AnswerFeedback({
                                           result,
                                           onNext,
                                           loading = false,
                                       }: AnswerFeedbackProps) {
    return (
        <div
            className={[
                "mt-6 rounded-3xl border p-6",
                result.correct
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50",
            ].join(" ")}
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p
                        className={[
                            "text-lg font-bold",
                            result.correct
                                ? "text-green-700"
                                : "text-red-700",
                        ].join(" ")}
                    >
                        {result.correct
                            ? "Correct! 🎉"
                            : "Not quite"}
                    </p>

                    <p className="mt-1 text-sm text-zinc-600">
                        {result.score} /{" "}
                        {result.maxScore} points
                    </p>
                </div>
            </div>

            {result.explanation && (
                <p className="mt-4 text-sm leading-6 text-zinc-700">
                    {result.explanation}
                </p>
            )}

            <button
                type="button"
                disabled={loading}
                onClick={onNext}
                className="mt-6 w-full rounded-2xl bg-zinc-900 px-6 py-4 font-semibold text-white disabled:opacity-50"
            >
                {loading
                    ? "Saving..."
                    : "Continue →"}
            </button>
        </div>
    );
}