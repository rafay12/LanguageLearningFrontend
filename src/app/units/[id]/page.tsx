"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface Unit {
    id: number;
    title: string;
    description?: string;
    number?: number;
}

interface Lesson {
    id: number;
    title: string;
    description?: string;
    number?: number;
    isActive?: boolean;
}

export default function UnitPage() {
    const params = useParams();
    const router = useRouter();

    const unitId = params.id as string;

    const [unit, setUnit] = useState<Unit | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadUnit() {
            try {
                const [unitData, lessonsData] = await Promise.all([
                    api<Unit>(`/units/${unitId}`),
                    api<Lesson[]>(`/lessons/unit/${unitId}`),
                ]);

                setUnit(unitData);
                setLessons(lessonsData);
            } catch (err) {
                console.error(err);

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load unit.",
                );
            } finally {
                setLoading(false);
            }
        }

        loadUnit();
    }, [unitId]);

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-zinc-50">
                <p className="text-sm text-zinc-500">
                    Loading unit...
                </p>
            </main>
        );
    }

    if (error || !unit) {
        return (
            <main className="min-h-screen bg-zinc-50 px-6 py-12">
                <div className="mx-auto max-w-5xl">
                    <button
                        onClick={() => router.back()}
                        className="mb-8 text-sm font-medium text-zinc-600"
                    >
                        ← Back
                    </button>

                    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
                        {error || "Unit not found."}
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-zinc-50 text-zinc-900">
            <header className="border-b border-zinc-200 bg-white">
                <div className="mx-auto flex h-16 max-w-7xl items-center px-6">
                    <button
                        onClick={() => router.back()}
                        className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
                    >
                        ← Back
                    </button>

                    <div className="ml-6 text-xl font-bold">
                        LingoLearn
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-5xl px-6 py-12">
                <section className="rounded-3xl border border-zinc-200 bg-white p-8">
                    <p className="text-sm font-medium uppercase tracking-wider text-zinc-400">
                        Unit {unit.number ?? ""}
                    </p>

                    <h1 className="mt-2 text-4xl font-bold">
                        {unit.title}
                    </h1>

                    {unit.description && (
                        <p className="mt-3 max-w-2xl text-zinc-600">
                            {unit.description}
                        </p>
                    )}
                </section>

                <section className="mt-12">
                    <h2 className="text-2xl font-bold">
                        Lessons
                    </h2>

                    <p className="mt-2 text-zinc-500">
                        Select a lesson to begin.
                    </p>

                    {lessons.length === 0 ? (
                        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-10 text-center">
                            <h3 className="font-semibold">
                                No lessons available
                            </h3>

                            <p className="mt-2 text-sm text-zinc-500">
                                This unit does not have lessons yet.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-6 space-y-3">
                            {lessons.map((lesson, index) => (
                                <button
                                    key={lesson.id}
                                    onClick={() =>
                                        router.push(`/lessons/${lesson.id}`)
                                    }
                                    className="group flex w-full items-center gap-5 rounded-2xl border border-zinc-200 bg-white p-5 text-left transition hover:border-zinc-300 hover:shadow-md"
                                >
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-100 font-bold">
                                        {lesson.number ?? index + 1}
                                    </div>

                                    <div className="flex-1">
                                        <h3 className="font-bold">
                                            {lesson.title}
                                        </h3>

                                        {lesson.description && (
                                            <p className="mt-1 text-sm text-zinc-500">
                                                {lesson.description}
                                            </p>
                                        )}
                                    </div>

                                    <span className="text-zinc-400 transition group-hover:translate-x-1 group-hover:text-zinc-900">
                    →
                  </span>
                                </button>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}