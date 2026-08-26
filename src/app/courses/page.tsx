"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { api } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

interface Course {
    id: number;
    title: string;
    description?: string | null;
    level?: string | null;
    variantId?: number | null;
}

interface User {
    id: number;
}

export default function CoursesPage() {
    const [courses, setCourses] =
        useState<Course[]>([]);

    const [enrolledIds, setEnrolledIds] =
        useState<Set<number>>(
            new Set(),
        );

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [enrolling, setEnrolling] =
        useState<number | null>(null);

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);

                const [
                    courseData,
                    user,
                ] = await Promise.all([
                    api<Course[]>("/courses"),
                    api<User>("/auth/me"),
                ]);

                setCourses(courseData);

                try {
                    const enrollments =
                        await api<
                            {
                                courseId: number;
                            }[]
                        >(
                            `/enrollments/user/${user.id}`,
                        );

                    setEnrolledIds(
                        new Set(
                            enrollments.map(
                                (item) =>
                                    item.courseId,
                            ),
                        ),
                    );
                } catch {
                    setEnrolledIds(
                        new Set(),
                    );
                }
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load courses.",
                );
            } finally {
                setLoading(false);
            }
        }

        load();
    }, []);

    async function enroll(
        courseId: number,
    ) {
        try {
            setEnrolling(courseId);

            const user =
                await api<User>(
                    "/auth/me",
                );

            await api(
                "/enrollments",
                {
                    method: "POST",
                    body: JSON.stringify({
                        userId: user.id,
                        courseId,
                    }),
                },
            );

            setEnrolledIds(
                (current) => {
                    const next =
                        new Set(current);

                    next.add(courseId);

                    return next;
                },
            );
        } catch (err) {
            alert(
                err instanceof Error
                    ? err.message
                    : "Unable to enroll.",
            );
        } finally {
            setEnrolling(null);
        }
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-zinc-50 p-6">
                <div className="mx-auto max-w-6xl animate-pulse">
                    <div className="h-8 w-56 rounded bg-zinc-200" />

                    <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map(
                            (item) => (
                                <div
                                    key={item}
                                    className="h-64 rounded-3xl bg-zinc-200"
                                />
                            ),
                        )}
                    </div>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-zinc-50">
                <p className="text-red-500">
                    {error}
                </p>
            </main>
        );
    }

    return (
        <ProtectedRoute>
            <main className="min-h-screen bg-zinc-50">
                <header className="border-b border-zinc-200 bg-white">
                    <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                        <Link
                            href="/dashboard"
                            className="font-bold"
                        >
                            LearnLanguage
                        </Link>

                        <Link
                            href="/dashboard"
                            className="text-sm text-zinc-500 hover:text-zinc-900"
                        >
                            Dashboard
                        </Link>
                    </div>
                </header>

                <div className="mx-auto max-w-6xl px-6 py-10">
                    <h1 className="text-4xl font-bold">
                        Explore courses
                    </h1>

                    <p className="mt-2 text-zinc-500">
                        Choose a language and start
                        learning.
                    </p>

                    {courses.length === 0 ? (
                        <div className="mt-10 rounded-3xl border border-zinc-200 bg-white p-10 text-center">
                            <p className="text-zinc-500">
                                No courses are available
                                yet.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                            {courses.map(
                                (course) => {
                                    const enrolled =
                                        enrolledIds.has(
                                            course.id,
                                        );

                                    return (
                                        <div
                                            key={
                                                course.id
                                            }
                                            className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm"
                                        >
                                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 text-xl font-bold text-white">
                                                {course.title
                                                    .charAt(
                                                        0,
                                                    )
                                                    .toUpperCase()}
                                            </div>

                                            <h2 className="mt-6 text-xl font-bold">
                                                {
                                                    course.title
                                                }
                                            </h2>

                                            {course.level && (
                                                <span className="mt-3 inline-block rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase text-zinc-500">
                                                {
                                                    course.level
                                                }
                                            </span>
                                            )}

                                            {course.description && (
                                                <p className="mt-4 line-clamp-3 text-sm leading-6 text-zinc-500">
                                                    {
                                                        course.description
                                                    }
                                                </p>
                                            )}

                                            <div className="mt-7 flex gap-3">
                                                {enrolled ? (
                                                    <Link
                                                        href={`/courses/${course.id}`}
                                                        className="flex-1 rounded-xl bg-zinc-900 px-4 py-3 text-center text-sm font-semibold text-white"
                                                    >
                                                        Continue
                                                    </Link>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            enroll(
                                                                course.id,
                                                            )
                                                        }
                                                        disabled={
                                                            enrolling ===
                                                            course.id
                                                        }
                                                        className="flex-1 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                                                    >
                                                        {enrolling ===
                                                        course.id
                                                            ? "Enrolling..."
                                                            : "Enroll"}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                },
                            )}
                        </div>
                    )}
                </div>
            </main>
        </ProtectedRoute>

    );
}