"use client";

import {
    useCallback,
    useEffect,
    useState,
} from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

import ProtectedRoute from "@/components/ProtectedRoute";
import { api } from "@/lib/api";

interface Language {
    id: number;
    name: string;
    nativeName?: string | null;
    code?: string | null;
    description?: string | null;
}

interface Course {
    id: number;
    title: string;
    description?: string | null;
    languageId?: number;
    isActive?: boolean;
}

interface LanguageResponse {
    language: Language;
    courses?: Course[];
}

export default function LanguagePage() {
    const params = useParams();

    const languageId = Number(
        params.id,
    );

    const [language, setLanguage] =
        useState<Language | null>(null);

    const [courses, setCourses] =
        useState<Course[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const loadLanguage =
        useCallback(async () => {
            try {
                setLoading(true);
                setError(null);

                const data =
                    await api<LanguageResponse>(
                        `/languages/${languageId}`,
                    );

                setLanguage(
                    data.language,
                );

                setCourses(
                    (data.courses ?? []).filter(
                        (course) =>
                            course.isActive !==
                            false,
                    ),
                );
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load language.",
                );
            } finally {
                setLoading(false);
            }
        }, [languageId]);

    useEffect(() => {
        if (
            languageId &&
            !Number.isNaN(
                languageId,
            )
        ) {
            void loadLanguage();
        }
    }, [
        languageId,
        loadLanguage,
    ]);

    if (loading) {
        return (
            <ProtectedRoute>
                <main className="min-h-screen bg-zinc-50 px-6 py-10">
                    <div className="mx-auto max-w-6xl">
                        <div className="h-10 w-72 animate-pulse rounded-xl bg-zinc-200" />

                        <div className="mt-10 h-52 animate-pulse rounded-3xl bg-zinc-200" />

                        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                            {Array.from({
                                length: 3,
                            }).map(
                                (_, index) => (
                                    <div
                                        key={
                                            index
                                        }
                                        className="h-64 animate-pulse rounded-3xl bg-zinc-200"
                                    />
                                ),
                            )}
                        </div>
                    </div>
                </main>
            </ProtectedRoute>
        );
    }

    if (error || !language) {
        return (
            <ProtectedRoute>
                <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
                    <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 text-center">
                        <h1 className="text-xl font-bold text-zinc-900">
                            Language unavailable
                        </h1>

                        <p className="mt-3 text-sm text-red-600">
                            {error ??
                                "Language not found."}
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                void loadLanguage()
                            }
                            className="mt-6 rounded-2xl bg-zinc-900 px-6 py-3 font-semibold text-white"
                        >
                            Try again
                        </button>
                    </div>
                </main>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <main className="min-h-screen bg-zinc-50">
                <div className="mx-auto max-w-6xl px-6 py-10">
                    <Link
                        href="/languages"
                        className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
                    >
                        ← All languages
                    </Link>

                    <section className="mt-8 rounded-3xl bg-zinc-900 p-8 text-white sm:p-12">
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-white text-3xl font-bold text-zinc-900">
                                {(
                                    language.nativeName ||
                                    language.name
                                ).charAt(0)}
                            </div>

                            <div>
                                <p className="text-sm font-medium uppercase tracking-wider text-zinc-400">
                                    Language
                                </p>

                                <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
                                    {
                                        language.name
                                    }
                                </h1>

                                {language.nativeName &&
                                    language.nativeName !==
                                    language.name && (
                                        <p className="mt-2 text-xl text-zinc-300">
                                            {
                                                language.nativeName
                                            }
                                        </p>
                                    )}

                                {language.code && (
                                    <p className="mt-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                                        {
                                            language.code
                                        }
                                    </p>
                                )}
                            </div>
                        </div>

                        {language.description && (
                            <p className="mt-8 max-w-3xl text-lg leading-8 text-zinc-300">
                                {
                                    language.description
                                }
                            </p>
                        )}
                    </section>

                    <section className="mt-10">
                        <div>
                            <p className="text-sm font-medium uppercase tracking-wider text-zinc-400">
                                Learning paths
                            </p>

                            <h2 className="mt-2 text-2xl font-bold text-zinc-900">
                                Courses
                            </h2>
                        </div>

                        {courses.length ===
                        0 ? (
                            <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-12 text-center">
                                <h3 className="text-xl font-bold text-zinc-900">
                                    Courses coming soon
                                </h3>

                                <p className="mt-2 text-sm text-zinc-500">
                                    There are currently
                                    no published courses
                                    for this language.
                                </p>
                            </div>
                        ) : (
                            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                                {courses.map(
                                    (
                                        course,
                                    ) => (
                                        <Link
                                            key={
                                                course.id
                                            }
                                            href={`/courses/${course.id}`}
                                            className="group rounded-3xl border border-zinc-200 bg-white p-6 transition hover:-translate-y-1 hover:border-zinc-300 hover:shadow-lg"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 font-bold text-white">
                                                    {course.title
                                                        .charAt(
                                                            0,
                                                        )
                                                        .toUpperCase()}
                                                </div>

                                                <span className="text-zinc-400 transition group-hover:translate-x-1 group-hover:text-zinc-900">
                                                    →
                                                </span>
                                            </div>

                                            <h3 className="mt-6 text-xl font-bold text-zinc-900">
                                                {
                                                    course.title
                                                }
                                            </h3>

                                            {course.description && (
                                                <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-500">
                                                    {
                                                        course.description
                                                    }
                                                </p>
                                            )}

                                            <div className="mt-6 text-sm font-semibold text-zinc-900">
                                                View course →
                                            </div>
                                        </Link>
                                    ),
                                )}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </ProtectedRoute>
    );
}