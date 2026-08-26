"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { api } from "@/lib/api";

interface Language {
    id: number;
    name: string;
    code: string;
}

interface Course {
    id: number;
    title: string;
    description?: string | null;
    type?: string | null;
    number?: number | null;
}

export default function LanguagePage() {
    const params = useParams();
    const router = useRouter();

    const languageId = Number(params.id);

    const [language, setLanguage] =
        useState<Language | null>(null);

    const [courses, setCourses] =
        useState<Course[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    useEffect(() => {
        async function loadLanguage() {
            try {
                const languageData =
                    await api<Language>(
                        `/languages/${languageId}`,
                    );

                setLanguage(languageData);

                /*
                 * We will connect courses properly after
                 * loading the language variant structure.
                 */
            } catch (err) {
                console.error(err);

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load language",
                );
            } finally {
                setLoading(false);
            }
        }

        if (Number.isFinite(languageId)) {
            loadLanguage();
        }
    }, [languageId]);

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                Loading...
            </main>
        );
    }

    if (error) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <div className="rounded-xl bg-red-50 px-6 py-4 text-red-600">
                    {error}
                </div>
            </main>
        );
    }

    if (!language) {
        return null;
    }

    return (
        <main className="min-h-screen bg-gray-50">

            <header className="border-b bg-white">
                <div className="mx-auto max-w-7xl px-6 py-4">

                    <button
                        onClick={() => router.push("/dashboard")}
                        className="text-sm text-gray-500 hover:text-black"
                    >
                        ← Back to dashboard
                    </button>

                </div>
            </header>

            <div className="mx-auto max-w-7xl px-6 py-10">

                <section className="rounded-3xl bg-white p-8 shadow-sm">

                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-3xl font-bold">
                        {language.name.charAt(0)}
                    </div>

                    <h1 className="mt-6 text-4xl font-bold">
                        Learn {language.name}
                    </h1>

                    <p className="mt-2 text-gray-600">
                        Choose a course to begin your journey.
                    </p>

                </section>

                <section className="mt-10">

                    <h2 className="text-2xl font-bold">
                        Courses
                    </h2>

                    {courses.length === 0 ? (
                        <div className="mt-5 rounded-2xl border bg-white p-8 text-gray-500">
                            Courses will appear here.
                        </div>
                    ) : (
                        <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">

                            {courses.map((course) => (
                                <button
                                    key={course.id}
                                    onClick={() =>
                                        router.push(
                                            `/courses/${course.id}`,
                                        )
                                    }
                                    className="rounded-2xl border bg-white p-6 text-left shadow-sm hover:shadow-md"
                                >
                                    <h3 className="text-xl font-bold">
                                        {course.title}
                                    </h3>

                                    {course.description && (
                                        <p className="mt-2 text-gray-500">
                                            {course.description}
                                        </p>
                                    )}

                                </button>
                            ))}

                        </div>
                    )}

                </section>

            </div>
        </main>
    );
}