"use client";

import Link from "next/link";

interface ContinueLearningProps {
    courseTitle: string;
    lessonTitle: string;
    lessonId: number;
    progress: number;
}

export default function ContinueLearning({
                                             courseTitle,
                                             lessonTitle,
                                             lessonId,
                                             progress,
                                         }: ContinueLearningProps) {
    const safeProgress = Math.min(
        100,
        Math.max(0, progress),
    );

    return (
        <section className="overflow-hidden rounded-3xl bg-zinc-900 text-white">
            <div className="p-8 sm:p-10">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                        <p className="text-sm font-medium uppercase tracking-wider text-zinc-400">
                            Continue learning
                        </p>

                        <h2 className="mt-3 text-3xl font-bold tracking-tight">
                            {courseTitle}
                        </h2>

                        <p className="mt-3 text-zinc-300">
                            Next lesson
                        </p>

                        <p className="mt-1 text-lg font-semibold">
                            {lessonTitle}
                        </p>

                        <Link
                            href={`/lessons/${lessonId}/learn`}
                            className="mt-7 inline-flex rounded-2xl bg-white px-6 py-3 font-semibold text-zinc-900 transition hover:bg-zinc-100"
                        >
                            Continue →
                        </Link>
                    </div>

                    <div className="w-full max-w-xs">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-400">
                                Progress
                            </span>

                            <span className="font-semibold">
                                {safeProgress}%
                            </span>
                        </div>

                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                            <div
                                className="h-full rounded-full bg-white transition-all"
                                style={{
                                    width: `${safeProgress}%`,
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}