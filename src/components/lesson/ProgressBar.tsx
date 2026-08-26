"use client";

interface ProgressBarProps {
    current: number;
    total: number;
}

export default function ProgressBar({
                                        current,
                                        total,
                                    }: ProgressBarProps) {
    const percentage =
        total > 0
            ? Math.min(
                100,
                Math.max(
                    0,
                    (current / total) * 100,
                ),
            )
            : 0;

    return (
        <div className="w-full">
            <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
                <span>
                    {current} of {total}
                </span>

                <span>
                    {Math.round(percentage)}%
                </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                <div
                    className="h-full rounded-full bg-zinc-900 transition-all duration-300"
                    style={{
                        width: `${percentage}%`,
                    }}
                />
            </div>
        </div>
    );
}