"use client";

import Link from "next/link";

interface LessonCompleteProps {
    score: number;
    total: number;
    lessonTitle: string;
}

export default function LessonComplete({
                                           score,
                                           total,
                                           lessonTitle,
                                       }: LessonCompleteProps) {
    const percentage =
        total > 0
            ? Math.round(
                (score / total) *
                100,
            )
            : 0;

    return (
        <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
            <div className="w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm sm:p-12">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-zinc-900 text-3xl text-white">
                    ✓
                </div>

                <p className="mt-8 text-sm font-medium uppercase tracking-wider text-zinc-400">
                    Lesson complete
                </p>

                <h1 className="mt-3 text-4xl font-bold text-zinc-900">
                    {lessonTitle}
                </h1>

                <p className="mt-4 text-zinc-500">
                    Great work. You finished
                    this lesson.
                </p>

                <div className="mt-10">
                    <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full border-8 border-zinc-900">
                        <div>
                            <p className="text-4xl font-bold text-zinc-900">
                                {percentage}%
                            </p>

                            <p className="mt-1 text-xs text-zinc-400">
                                Score
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-10 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-zinc-50 p-5">
                        <p className="text-3xl font-bold">
                            {score}
                        </p>

                        <p className="mt-1 text-sm text-zinc-500">
                            Points earned
                        </p>
                    </div>

                    <div className="rounded-2xl bg-zinc-50 p-5">
                        <p className="text-3xl font-bold">
                            {total}
                        </p>

                        <p className="mt-1 text-sm text-zinc-500">
                            Exercises
                        </p>
                    </div>
                </div>

                <div className="mt-10 grid gap-3 sm:grid-cols-2">
                    <Link
                        href="/dashboard"
                        className="rounded-2xl border border-zinc-200 px-6 py-4 font-semibold text-zinc-700 transition hover:bg-zinc-50"
                    >
                        Dashboard
                    </Link>

                    <Link
                        href="/courses"
                        className="rounded-2xl bg-zinc-900 px-6 py-4 font-semibold text-white transition hover:bg-zinc-800"
                    >
                        Continue learning
                    </Link>
                </div>
            </div>
        </main>
    );
}