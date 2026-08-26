"use client";

interface Option {
    id: number;
    text: string;
}

interface MultipleChoiceExerciseProps {
    question: string;
    options: Option[];
    selectedOption: number | null;
    disabled?: boolean;
    onSelect: (optionId: number) => void;
}

export default function MultipleChoiceExercise({
                                                   question,
                                                   options,
                                                   selectedOption,
                                                   disabled = false,
                                                   onSelect,
                                               }: MultipleChoiceExerciseProps) {
    return (
        <div>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
                {question}
            </h1>

            <div className="mt-8 space-y-3">
                {options.map((option) => {
                    const selected = selectedOption === option.id;

                    return (
                        <button
                            key={option.id}
                            type="button"
                            disabled={disabled}
                            onClick={() => onSelect(option.id)}
                            className={[
                                "w-full rounded-2xl border p-5 text-left transition",
                                selected
                                    ? "border-zinc-900 bg-zinc-100"
                                    : "border-zinc-200 bg-white hover:border-zinc-400",
                                disabled
                                    ? "cursor-not-allowed opacity-60"
                                    : "",
                            ].join(" ")}
                        >
                            <div className="flex items-center gap-4">
                                <div
                                    className={[
                                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                                        selected
                                            ? "border-zinc-900 bg-zinc-900"
                                            : "border-zinc-300",
                                    ].join(" ")}
                                >
                                    {selected && (
                                        <div className="h-2 w-2 rounded-full bg-white" />
                                    )}
                                </div>

                                <span className="font-medium">
                  {option.text}
                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}