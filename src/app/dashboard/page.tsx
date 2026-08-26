"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";

import { api } from "@/lib/api";
import LogoutButton from "@/components/LogoutButton";

interface User {
    id: number;
    name?: string | null;
    username?: string | null;
    email?: string | null;
}

interface Course {
    id: number;
    title: string;
    description?: string | null;
    level?: string | null;
    variantId?: number | null;
}

interface Enrollment {
    id: number;
    userId: number;
    courseId: number;
    course?: Course | null;
}

interface LessonProgress {
    id?: number;
    lessonId: number;
    userId?: number;
    status?: string | null;
    progress?: number | null;
    score?: number | null;
    completedAt?: string | null;
}

interface Unit {
    id: number;
    title: string;
    number?: number | null;
    courseId: number;
}

interface Lesson {
    id: number;
    title: string;
    description?: string | null;
    number?: number | null;
    unitId: number;
}

interface CourseSummary {
    course: Course;
    units: Unit[];
    lessons: Lesson[];
}

export default function DashboardPage() {
    const [user, setUser] =
        useState<User | null>(null);

    const [enrollments, setEnrollments] =
        useState<Enrollment[]>([]);

    const [progress, setProgress] =
        useState<LessonProgress[]>([]);

    const [courseSummaries, setCourseSummaries] =
        useState<CourseSummary[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    useEffect(() => {
        async function loadDashboard() {
            try {
                setLoading(true);
                setError("");

                const currentUser =
                    await api<User>("/auth/me");

                setUser(currentUser);

                const enrollmentData =
                    await api<Enrollment[]>(
                        `/enrollments/user/${currentUser.id}`,
                    );

                setEnrollments(
                    enrollmentData,
                );

                const progressData =
                    await api<LessonProgress[]>(
                        `/lesson-progress/user/${currentUser.id}`,
                    );

                setProgress(
                    progressData,
                );

                /*
                 * Load course information for
                 * every enrollment.
                 */
                const summaries =
                    await Promise.all(
                        enrollmentData.map(
                            async (enrollment) => {
                                let course =
                                    enrollment.course ??
                                    null;

                                if (!course) {
                                    try {
                                        course =
                                            await api<Course>(
                                                `/courses/${enrollment.courseId}`,
                                            );
                                    } catch {
                                        return null;
                                    }
                                }

                                if (!course) {
                                    return null;
                                }

                                let units: Unit[] =
                                    [];

                                try {
                                    units =
                                        await api<Unit[]>(
                                            `/units/course/${course.id}`,
                                        );
                                } catch {
                                    units = [];
                                }

                                const lessons =
                                    (
                                        await Promise.all(
                                            units.map(
                                                async (
                                                    unit,
                                                ) => {
                                                    try {
                                                        return await api<Lesson[]>(
                                                            `/lessons/unit/${unit.id}`,
                                                        );
                                                    } catch {
                                                        return [];
                                                    }
                                                },
                                            ),
                                        )
                                    ).flat();

                                return {
                                    course,
                                    units,
                                    lessons,
                                };
                            },
                        ),
                    );

                setCourseSummaries(
                    summaries.filter(
                        (
                            item,
                        ): item is CourseSummary =>
                            item !== null,
                    ),
                );
            } catch (err) {
                console.error(err);

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load dashboard.",
                );
            } finally {
                setLoading(false);
            }
        }

        loadDashboard();
    }, []);

    const progressMap = useMemo(() => {
        const map = new Map<
            number,
            LessonProgress
        >();

        for (const item of progress) {
            map.set(item.lessonId, item);
        }

        return map;
    }, [progress]);

    const totalLessons =
        courseSummaries.reduce(
            (total, item) =>
                total + item.lessons.length,
            0,
        );

    const completedLessons =
        courseSummaries.reduce(
            (total, item) =>
                total +
                item.lessons.filter(
                    (lesson) => {
                        const item =
                            progressMap.get(
                                lesson.id,
                            );

                        return (
                            item?.status ===
                            "COMPLETED" ||
                            Boolean(
                                item?.completedAt,
                            )
                        );
                    },
                ).length,
            0,
        );

    const overallProgress =
        totalLessons > 0
            ? Math.round(
                (completedLessons /
                    totalLessons) *
                100,
            )
            : 0;

    /*
     * Find the first unfinished lesson.
     * This becomes the dashboard's
     * "Continue learning" destination.
     */
    const continueLearning =
        useMemo(() => {
            for (const summary of courseSummaries) {
                for (const lesson of summary.lessons) {
                    const item =
                        progressMap.get(
                            lesson.id,
                        );

                    const completed =
                        item?.status ===
                        "COMPLETED" ||
                        Boolean(
                            item?.completedAt,
                        );

                    if (!completed) {
                        return {
                            course:
                            summary.course,
                            lesson,
                        };
                    }
                }
            }

            return null;
        }, [
            courseSummaries,
            progressMap,
        ]);

    function displayName() {
        return (
            user?.name ||
            user?.username ||
            user?.email?.split("@")[0] ||
            "Learner"
        );
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-zinc-50">
                <div className="mx-auto max-w-6xl px-6 py-10">
                    <div className="animate-pulse">
                        <div className="h-8 w-64 rounded bg-zinc-200" />

                        <div className="mt-3 h-4 w-80 rounded bg-zinc-200" />

                        <div className="mt-10 h-48 rounded-3xl bg-zinc-200" />

                        <div className="mt-8 grid gap-5 md:grid-cols-3">
                            <div className="h-32 rounded-3xl bg-zinc-200" />
                            <div className="h-32 rounded-3xl bg-zinc-200" />
                            <div className="h-32 rounded-3xl bg-zinc-200" />
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
                <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-xl text-red-500">
                        !
                    </div>

                    <h1 className="mt-5 text-xl font-bold">
                        Dashboard unavailable
                    </h1>

                    <p className="mt-2 text-sm text-zinc-500">
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            window.location.reload()
                        }
                        className="mt-6 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white"
                    >
                        Try again
                    </button>
                </div>
            </main>
        );
    }

    return (
        <ProtectedRoute>
            <main className="min-h-screen bg-zinc-50 text-zinc-900">
                {/* Navigation */}
                <header className="border-b border-zinc-200 bg-white">
                    <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                        <Link
                            href="/dashboard"
                            className="text-lg font-bold"
                        >
                            LearnLanguage
                        </Link>

                        <nav className="flex items-center gap-5">
                            <Link
                                href="/dashboard"
                                className="text-sm font-medium text-zinc-900"
                            >
                                Dashboard
                            </Link>

                            <Link
                                href="/profile"
                                className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
                            >
                                Profile
                            </Link>

                            <LogoutButton />
                        </nav>
                    </div>
                </header>

                <div className="mx-auto max-w-6xl px-6 py-10">
                    {/* Welcome */}
                    <section>
                        <p className="text-sm font-medium text-zinc-400">
                            Welcome back
                        </p>

                        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                            {displayName()}
                        </h1>

                        <p className="mt-2 text-zinc-500">
                            Keep going. Every lesson gets
                            you closer to fluency.
                        </p>
                    </section>

                    {/* Continue Learning */}
                    {continueLearning && (
                        <section className="mt-8 overflow-hidden rounded-3xl bg-zinc-900 text-white shadow-sm">
                            <div className="p-7 sm:p-9">
                                <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
                                    <div className="max-w-xl">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                            Continue learning
                                        </p>

                                        <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
                                            {
                                                continueLearning
                                                    .course
                                                    .title
                                            }
                                        </h2>

                                        <p className="mt-2 text-zinc-400">
                                            Next lesson:{" "}
                                            <span className="text-zinc-200">
                                            {
                                                continueLearning
                                                    .lesson
                                                    .title
                                            }
                                        </span>
                                        </p>
                                    </div>

                                    <Link
                                        href={`/lessons/${continueLearning.lesson.id}/learn`}
                                        className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-white px-6 py-4 font-semibold text-zinc-900 transition hover:bg-zinc-100"
                                    >
                                        Continue →
                                    </Link>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Statistics */}
                    <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="rounded-3xl border border-zinc-200 bg-white p-6">
                            <p className="text-sm text-zinc-500">
                                Overall progress
                            </p>

                            <p className="mt-2 text-3xl font-bold">
                                {overallProgress}%
                            </p>

                            <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-100">
                                <div
                                    className="h-full rounded-full bg-zinc-900"
                                    style={{
                                        width: `${overallProgress}%`,
                                    }}
                                />
                            </div>
                        </div>

                        <div className="rounded-3xl border border-zinc-200 bg-white p-6">
                            <p className="text-sm text-zinc-500">
                                Completed lessons
                            </p>

                            <p className="mt-2 text-3xl font-bold">
                                {
                                    completedLessons
                                }
                            </p>

                            <p className="mt-2 text-sm text-zinc-400">
                                of {totalLessons} total
                            </p>
                        </div>

                        <div className="rounded-3xl border border-zinc-200 bg-white p-6">
                            <p className="text-sm text-zinc-500">
                                My courses
                            </p>

                            <p className="mt-2 text-3xl font-bold">
                                {
                                    courseSummaries.length
                                }
                            </p>

                            <p className="mt-2 text-sm text-zinc-400">
                                enrolled courses
                            </p>
                        </div>
                    </section>

                    {/* Courses */}
                    <section className="mt-12">
                        <div className="flex items-end justify-between">
                            <div>
                                <h2 className="text-2xl font-bold">
                                    My courses
                                </h2>

                                <p className="mt-1 text-sm text-zinc-500">
                                    Continue your language journey.
                                </p>
                            </div>
                        </div>

                        {courseSummaries.length ===
                        0 ? (
                            <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-10 text-center">
                                <h3 className="font-semibold">
                                    No courses yet
                                </h3>

                                <p className="mt-2 text-sm text-zinc-500">
                                    Enroll in a course to
                                    start learning.
                                </p>

                                <Link
                                    href="/courses"
                                    className="mt-6 inline-flex rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white"
                                >
                                    Explore courses
                                </Link>
                            </div>
                        ) : (
                            <div className="mt-6 grid gap-5 md:grid-cols-2">
                                {courseSummaries.map(
                                    (summary) => {
                                        const completed =
                                            summary.lessons.filter(
                                                (
                                                    lesson,
                                                ) => {
                                                    const item =
                                                        progressMap.get(
                                                            lesson.id,
                                                        );

                                                    return (
                                                        item?.status ===
                                                        "COMPLETED" ||
                                                        Boolean(
                                                            item?.completedAt,
                                                        )
                                                    );
                                                },
                                            ).length;

                                        const total =
                                            summary
                                                .lessons
                                                .length;

                                        const percent =
                                            total > 0
                                                ? Math.round(
                                                    (completed /
                                                        total) *
                                                    100,
                                                )
                                                : 0;

                                        return (
                                            <Link
                                                key={
                                                    summary
                                                        .course
                                                        .id
                                                }
                                                href={`/courses/${summary.course.id}`}
                                                className="group rounded-3xl border border-zinc-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
                                            >
                                                <div className="flex items-start justify-between gap-5">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-lg font-bold text-white">
                                                        {
                                                            summary
                                                                .course
                                                                .title
                                                                .charAt(
                                                                    0,
                                                                )
                                                                .toUpperCase()
                                                        }
                                                    </div>

                                                    <span className="text-zinc-400 transition group-hover:translate-x-1">
                                                    →
                                                </span>
                                                </div>

                                                <h3 className="mt-6 text-xl font-bold">
                                                    {
                                                        summary
                                                            .course
                                                            .title
                                                    }
                                                </h3>

                                                {summary
                                                    .course
                                                    .description && (
                                                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-500">
                                                        {
                                                            summary
                                                                .course
                                                                .description
                                                        }
                                                    </p>
                                                )}

                                                <div className="mt-6">
                                                    <div className="flex items-center justify-between text-xs">
                                                    <span className="text-zinc-500">
                                                        Progress
                                                    </span>

                                                        <span className="font-semibold">
                                                        {
                                                            percent
                                                        }
                                                            %
                                                    </span>
                                                    </div>

                                                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
                                                        <div
                                                            className="h-full rounded-full bg-zinc-900 transition-all"
                                                            style={{
                                                                width: `${percent}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="mt-5 flex items-center justify-between text-xs text-zinc-400">
                                                <span>
                                                    {
                                                        completed
                                                    }{" "}
                                                    /{" "}
                                                    {
                                                        total
                                                    }{" "}
                                                    lessons
                                                </span>

                                                    <span>
                                                    {
                                                        summary
                                                            .units
                                                            .length
                                                    }{" "}
                                                        units
                                                </span>
                                                </div>
                                            </Link>
                                        );
                                    },
                                )}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </ProtectedRoute>

    );
}