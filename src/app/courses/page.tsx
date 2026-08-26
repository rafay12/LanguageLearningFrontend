"use client";

import {
    useCallback,
    useEffect,
    useState,
} from "react";
import Link from "next/link";

import ProtectedRoute from "@/components/ProtectedRoute";
import { api } from "@/lib/api";

interface Course {
    id: number;
    title: string;
    description?: string | null;
    languageId?: number;
    isActive?: boolean;
}

export default function CoursesPage() {
    const [courses, setCourses] =
        useState<Course[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const loadCourses =
        useCallback(async () => {
            try {
                setLoading(true);
                setError(null);

                const data =
                    await api<Course[]>(
                        "/courses",
                    );

                setCourses(
                    data.filter(
                        (course) =>
                            course.isActive !==
                            false,
                    ),
                );
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load courses.",
                );
            } finally {
                setLoading(false);
            }
        }, []);

    useEffect(() => {
        void loadCourses();
    }, [loadCourses]);

    return (
        <ProtectedRoute>
            <main className="min-h-screen bg-zinc-50">
                <div className="mx-auto max-w-6xl px-6 py-10">
                    <div>
                        <p className="text-sm font-medium uppercase tracking-wider text-zinc-400">
                            Learn
                        </p>

                        <h1 className="mt-2 text-4xl font-bold tracking-tight text-zinc-900">
                            Courses
                        </h1>

                        <p className="mt-3 max-w-2xl text-zinc-500">
                            Choose a course and
                            continue building your
                            language skills.
                        </p>
                    </div>

                    {loading && (
                        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {Array.from({
                                length: 6,
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
                    )}

                    {!loading &&
                        error && (
                            <div className="mt-10 rounded-3xl border border-red-200 bg-white p-8">
                                <p className="text-sm text-red-600">
                                    {error}
                                </p>

                                <button
                                    type="button"
                                    onClick={() =>
                                        void loadCourses()
                                    }
                                    className="mt-5 rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white"
                                >
                                    Try again
                                </button>
                            </div>
                        )}

                    {!loading &&
                        !error &&
                        courses.length ===
                        0 && (
                            <div className="mt-10 rounded-3xl border border-zinc-200 bg-white p-12 text-center">
                                <h2 className="text-xl font-bold text-zinc-900">
                                    No courses yet
                                </h2>

                                <p className="mt-2 text-sm text-zinc-500">
                                    Courses will
                                    appear here once
                                    they are
                                    published.
                                </p>
                            </div>
                        )}

                    {!loading &&
                        !error &&
                        courses.length >
                        0 && (
                            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                {courses.map(
                                    (
                                        course,
                                    ) => (
                                        <Link
                                            key={
                                                course.id
                                            }
                                            href={`/courses/${course.id}`}
                                            className="group overflow-hidden rounded-3xl border border-zinc-200 bg-white transition hover:-translate-y-1 hover:border-zinc-300 hover:shadow-lg"
                                        >
                                            <div className="h-32 bg-zinc-900 p-6">
                                                <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
                                                    Course
                                                </span>
                                            </div>

                                            <div className="p-6">
                                                <h2 className="text-xl font-bold text-zinc-900">
                                                    {
                                                        course.title
                                                    }
                                                </h2>

                                                {course.description && (
                                                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-500">
                                                        {
                                                            course.description
                                                        }
                                                    </p>
                                                )}

                                                <div className="mt-6 flex items-center justify-between">
                                                    <span className="text-sm font-semibold text-zinc-900">
                                                        Start learning
                                                    </span>

                                                    <span className="text-zinc-400 transition group-hover:translate-x-1 group-hover:text-zinc-900">
                                                        →
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    ),
                                )}
                            </div>
                        )}
                </div>
            </main>
        </ProtectedRoute>
    );
}