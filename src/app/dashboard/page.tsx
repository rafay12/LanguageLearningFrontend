"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import Link from "next/link";

import ProtectedRoute from "@/components/ProtectedRoute";
import { api } from "@/lib/api";

import LearningStats from "@/components/dashboard/LearningStats";
import ContinueLearning from "@/components/dashboard/ContinueLearning";
import CourseProgressCard from "@/components/dashboard/CourseProgressCard";

interface Course {
    id: number;
    title: string;
    description?: string | null;
    languageId?: number;
    isActive?: boolean;
}

interface Lesson {
    id: number;
    unitId: number;
    title: string;
    description?: string | null;
    number: number;
}

interface Unit {
    id: number;
    courseId: number;
    title: string;
    number: number;
}

interface Progress {
    lessonId: number;
    progress?: number;
    status?: string;
    score?: number;
}

interface CourseData {
    course: Course;
    units: Unit[];
    lessons: Lesson[];
    progress: Progress[];
}

interface LearningStatsResponse {
    xp?: number;
    streak?: number;
}

export default function DashboardPage() {
    const [courses, setCourses] =
        useState<CourseData[]>([]);

    const [xp, setXp] =
        useState(0);

    const [streak, setStreak] =
        useState(0);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const loadDashboard =
        useCallback(async () => {
            try {
                setLoading(true);
                setError(null);

                const courseList =
                    await api<Course[]>(
                        "/courses",
                    );

                const activeCourses =
                    (courseList ?? []).filter(
                        (course) =>
                            course &&
                            typeof course.id ===
                            "number" &&
                            course.isActive !==
                            false,
                    );

                const results =
                    await Promise.all(
                        activeCourses.map(
                            async (course) => {
                                try {
                                    const data =
                                        await api<{
                                            course?: Course;
                                            units?: Unit[];
                                            lessons?: Lesson[];
                                        }>(
                                            `/courses/${course.id}`,
                                        );

                                    /*
                                     * Some backend responses may return
                                     * the course directly or may omit it.
                                     *
                                     * The course from /courses is already
                                     * valid, so use it as the fallback.
                                     */
                                    const resolvedCourse =
                                        data?.course ??
                                        course;

                                    if (
                                        !resolvedCourse ||
                                        typeof resolvedCourse.id !==
                                        "number"
                                    ) {
                                        return null;
                                    }

                                    const lessons =
                                        (
                                            data?.lessons ??
                                            []
                                        )
                                            .filter(
                                                (
                                                    lesson,
                                                ) =>
                                                    lesson &&
                                                    typeof lesson.id ===
                                                    "number",
                                            )
                                            .sort(
                                                (
                                                    a,
                                                    b,
                                                ) =>
                                                    a.number -
                                                    b.number,
                                            );

                                    const progress =
                                        await Promise.all(
                                            lessons.map(
                                                async (
                                                    lesson,
                                                ) => {
                                                    try {
                                                        return await api<Progress>(
                                                            `/lesson-progress/${lesson.id}`,
                                                        );
                                                    } catch {
                                                        return {
                                                            lessonId:
                                                            lesson.id,
                                                            progress: 0,
                                                        };
                                                    }
                                                },
                                            ),
                                        );

                                    return {
                                        course:
                                        resolvedCourse,
                                        units:
                                            data?.units ??
                                            [],
                                        lessons,
                                        progress,
                                    };
                                } catch {
                                    /*
                                     * If one course fails to load,
                                     * don't crash the entire dashboard.
                                     */
                                    return {
                                        course,
                                        units: [],
                                        lessons: [],
                                        progress: [],
                                    };
                                }
                            },
                        ),
                    );

                const validResults =
                    results.filter(
                        (
                            item,
                        ): item is CourseData =>
                            item !== null &&
                            item.course !==
                            undefined &&
                            typeof item.course.id ===
                            "number",
                    );

                setCourses(
                    validResults,
                );

                /*
                 * Learning statistics are optional.
                 */
                try {
                    const stats =
                        await api<LearningStatsResponse>(
                            "/learning-stats",
                        );

                    setXp(
                        stats?.xp ?? 0,
                    );

                    setStreak(
                        stats?.streak ?? 0,
                    );
                } catch {
                    setXp(0);
                    setStreak(0);
                }
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load dashboard.",
                );
            } finally {
                setLoading(false);
            }
        }, []);

    useEffect(() => {
        void loadDashboard();
    }, [loadDashboard]);

    const statistics =
        useMemo(() => {
            let lessonsCompleted = 0;
            let lessonsStarted = 0;
            let totalProgress = 0;
            let totalLessons = 0;

            for (const course of courses) {
                for (const lesson of course.lessons) {
                    totalLessons++;

                    const lessonProgress =
                        course.progress.find(
                            (item) =>
                                item &&
                                item.lessonId ===
                                lesson.id,
                        );

                    const value =
                        lessonProgress?.progress ??
                        0;

                    totalProgress += value;

                    if (value > 0) {
                        lessonsStarted++;
                    }

                    if (
                        value >= 100 ||
                        lessonProgress?.status ===
                        "completed"
                    ) {
                        lessonsCompleted++;
                    }
                }
            }

            return {
                lessonsCompleted,
                lessonsStarted,
                totalLessons,
                averageProgress:
                    totalLessons > 0
                        ? Math.round(
                            totalProgress /
                            totalLessons,
                        )
                        : 0,
            };
        }, [courses]);

    const currentLesson =
        useMemo(() => {
            for (const course of courses) {
                for (const lesson of course.lessons) {
                    const progress =
                        course.progress.find(
                            (item) =>
                                item &&
                                item.lessonId ===
                                lesson.id,
                        );

                    const value =
                        progress?.progress ??
                        0;

                    if (
                        value > 0 &&
                        value < 100
                    ) {
                        return {
                            course,
                            lesson,
                            progress: value,
                        };
                    }
                }
            }

            return null;
        }, [courses]);

    if (loading) {
        return (
            <ProtectedRoute>
                <main className="min-h-screen bg-zinc-50">
                    <div className="mx-auto max-w-6xl px-6 py-10">
                        <div className="h-10 w-64 animate-pulse rounded-xl bg-zinc-200" />

                        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                            {Array.from({
                                length: 6,
                            }).map(
                                (_, index) => (
                                    <div
                                        key={
                                            index
                                        }
                                        className="h-32 animate-pulse rounded-3xl bg-zinc-200"
                                    />
                                ),
                            )}
                        </div>

                        <div className="mt-8 h-64 animate-pulse rounded-3xl bg-zinc-200" />
                    </div>
                </main>
            </ProtectedRoute>
        );
    }

    if (error) {
        return (
            <ProtectedRoute>
                <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
                    <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 text-center">
                        <h1 className="text-xl font-bold text-zinc-900">
                            Dashboard unavailable
                        </h1>

                        <p className="mt-3 text-sm text-red-600">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                void loadDashboard()
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
                    <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                        <div>
                            <p className="text-sm font-medium uppercase tracking-wider text-zinc-400">
                                Dashboard
                            </p>

                            <h1 className="mt-2 text-4xl font-bold tracking-tight text-zinc-900">
                                Keep learning.
                            </h1>

                            <p className="mt-3 text-zinc-500">
                                Continue where you left
                                off or explore something
                                new.
                            </p>
                        </div>

                        <Link
                            href="/courses"
                            className="inline-flex items-center justify-center rounded-2xl bg-zinc-900 px-6 py-3 font-semibold text-white transition hover:bg-zinc-800"
                        >
                            Browse courses →
                        </Link>
                    </header>

                    <div className="mt-10">
                        <LearningStats
                            lessonsCompleted={
                                statistics.lessonsCompleted
                            }
                            lessonsStarted={
                                statistics.lessonsStarted
                            }
                            totalLessons={
                                statistics.totalLessons
                            }
                            averageProgress={
                                statistics.averageProgress
                            }
                            xp={xp}
                            streak={streak}
                        />
                    </div>

                    <div className="mt-8">
                        {currentLesson ? (
                            <ContinueLearning
                                courseTitle={
                                    currentLesson
                                        .course
                                        .title
                                }
                                lessonTitle={
                                    currentLesson
                                        .lesson
                                        .title
                                }
                                lessonId={
                                    currentLesson
                                        .lesson
                                        .id
                                }
                                progress={
                                    currentLesson
                                        .progress
                                }
                            />
                        ) : (
                            <section className="rounded-3xl border border-zinc-200 bg-white p-8 sm:p-10">
                                <p className="text-sm font-medium uppercase tracking-wider text-zinc-400">
                                    Start learning
                                </p>

                                <h2 className="mt-2 text-2xl font-bold text-zinc-900">
                                    Choose your first lesson
                                </h2>

                                <p className="mt-3 max-w-xl text-zinc-500">
                                    You haven't started a
                                    lesson yet. Pick a
                                    course and begin your
                                    learning journey.
                                </p>

                                <Link
                                    href="/courses"
                                    className="mt-6 inline-flex rounded-2xl bg-zinc-900 px-6 py-3 font-semibold text-white"
                                >
                                    Explore courses →
                                </Link>
                            </section>
                        )}
                    </div>

                    <section className="mt-10">
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-sm font-medium uppercase tracking-wider text-zinc-400">
                                    Your courses
                                </p>

                                <h2 className="mt-2 text-2xl font-bold text-zinc-900">
                                    Learning library
                                </h2>
                            </div>

                            <Link
                                href="/courses"
                                className="text-sm font-semibold text-zinc-600 hover:text-zinc-900"
                            >
                                View all →
                            </Link>
                        </div>

                        {courses.length > 0 ? (
                            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                                {courses
                                    .slice(0, 6)
                                    .map(
                                        (
                                            item,
                                        ) => {
                                            if (
                                                !item ||
                                                !item.course
                                            ) {
                                                return null;
                                            }

                                            const completed =
                                                (
                                                    item.progress ??
                                                    []
                                                ).filter(
                                                    (
                                                        progress,
                                                    ) =>
                                                        progress &&
                                                        (progress.progress ===
                                                            100 ||
                                                            progress.status ===
                                                            "completed"),
                                                ).length;

                                            return (
                                                <CourseProgressCard
                                                    key={
                                                        item
                                                            .course
                                                            .id
                                                    }
                                                    courseId={
                                                        item
                                                            .course
                                                            .id
                                                    }
                                                    title={
                                                        item
                                                            .course
                                                            .title
                                                    }
                                                    description={
                                                        item
                                                            .course
                                                            .description
                                                    }
                                                    totalLessons={
                                                        item
                                                            .lessons
                                                            .length
                                                    }
                                                    completedLessons={
                                                        completed
                                                    }
                                                />
                                            );
                                        },
                                    )}
                            </div>
                        ) : (
                            <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-10 text-center">
                                <p className="text-zinc-500">
                                    No courses available
                                    yet.
                                </p>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </ProtectedRoute>
    );
}