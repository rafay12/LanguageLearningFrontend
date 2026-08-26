"use client";

import Link from "next/link";
import ProgressBar from "./ProgressBar";

interface ExerciseShellProps {
    current: number;
    total: number;
    children: React.ReactNode;
    canContinue?: boolean;
    onContinue?: () => void;
    lessonTitle: string;
}

export default function ExerciseShell({
                                          current,
                                          total,
                                          children,
                                          canContinue = true,
                                          onContinue,
                                          lessonTitle,
                                      }: ExerciseShellProps) {
    return (
        <main className="min-h-screen bg-zinc-50">
            <div className="mx-auto max-w-3xl px-6 py-8">
                <div className="mb-8 flex items-center justify-between gap-5">
                    <Link
                        href="/dashboard"
                        className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
                    >
                        ← Exit lesson
                    </Link>

                    <span className="text-sm font-semibold text-zinc-900">
                        {lessonTitle}
                    </span>
                </div>

                <ProgressBar
                    current={current}
                    total={total}
                />

                <section className="mt-10 rounded-3xl border border-zinc-200 bg-white p-8 sm:p-12">
                    {children}
                </section>

                {canContinue &&
                    onContinue && (
                        <div className="mt-6 flex justify-end">
                            <button
                                type="button"
                                onClick={
                                    onContinue
                                }
                                className="rounded-2xl bg-zinc-900 px-7 py-3 font-semibold text-white transition hover:bg-zinc-800"
                            >
                                Continue →
                            </button>
                        </div>
                    )}
            </div>
        </main>
    );
}