"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface Course {
    id: number;
    title: string;
    description?: string;
    type?: string;
    number?: number;
    isActive?: boolean;
}

export default function VariantCoursesPage() {
    const params = useParams();
    const router = useRouter();

    const variantId = params.variantId as string;

    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadCourses() {
            try {
                const data = await api<Course[]>(
                    `/courses/variant/${variantId}`,
                );

                setCourses(data);
            } catch (err) {
                console.error(err);

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load courses.",
                );
            } finally {
                setLoading(false);
            }
        }

        loadCourses();
    }, [variantId]);

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-zinc-50">
                <p className="text-sm text-zinc-500">
                    Loading courses...
                </p>
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

            <div className="mx-auto max-w-6xl px-6 py-12">
                <section>
                    <p className="text-sm font-medium uppercase tracking-wider text-zinc-400">
                        Courses
                    </p>

                    <h1 className="mt-2 text-4xl font-bold">
                        Choose your course
                    </h1>

                    <p className="mt-3 text-zinc-500">
                        Select a course to begin learning.
                    </p>
                </section>

                {error && (
                    <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {!error && courses.length === 0 && (
                    <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-10 text-center">
                        <h2 className="font-semibold">
                            No courses available
                        </h2>

                        <p className="mt-2 text-sm text-zinc-500">
                            This language variant does not have any courses yet.
                        </p>
                    </div>
                )}

                <div className="mt-10 grid gap-6 md:grid-cols-2">
                    {courses.map((course) => (
                        <button
                            key={course.id}
                            onClick={() =>
                                router.push(`/courses/${course.id}`)
                            }
                            className="group rounded-3xl border border-zinc-200 bg-white p-7 text-left transition hover:-translate-y-1 hover:border-zinc-300 hover:shadow-lg"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-xl font-bold">
                                    {course.number ?? "→"}
                                </div>

                                <span className="text-zinc-400 transition group-hover:translate-x-1 group-hover:text-zinc-800">
                  →
                </span>
                            </div>

                            <h2 className="mt-6 text-2xl font-bold">
                                {course.title}
                            </h2>

                            {course.description && (
                                <p className="mt-3 text-sm leading-6 text-zinc-500">
                                    {course.description}
                                </p>
                            )}

                            {course.type && (
                                <div className="mt-5 inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
                                    {course.type}
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </main>
    );
}