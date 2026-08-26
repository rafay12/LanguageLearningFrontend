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

interface Course {
    id: number;
    title: string;
    description?: string | null;
    languageId?: number;
    isActive?: boolean;
}

interface Unit {
    id: number;
    courseId: number;
    title: string;
    description?: string | null;
    number: number;
    isActive?: boolean;
}

interface Lesson {
    id: number;
    unitId: number;
    title: string;
    description?: string | null;
    number: number;
    isActive?: boolean;
}

interface CourseResponse {
    course: Course;
    units?: Unit[];
    lessons?: Lesson[];
}

interface Progress {
    lessonId: number;
    progress?: number;
    status?: string;
}

export default function CoursePage() {
    const params = useParams();

    const courseId = Number(params.id);

    const [course, setCourse] =
        useState<Course | null>(null);

    const [units, setUnits] =
        useState<Unit[]>([]);

    const [lessons, setLessons] =
        useState<Lesson[]>([]);

    const [progress, setProgress] =
        useState<Record<number, Progress>>(
            {},
        );

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const loadCourse =
        useCallback(async () => {
            try {
                setLoading(true);
                setError(null);

                const data =
                    await api<CourseResponse>(
                        `/courses/${courseId}`,
                    );

                setCourse(
                    data.course,
                );

                setUnits(
                    (data.units ?? [])
                        .slice()
                        .sort(
                            (a, b) =>
                                a.number -
                                b.number,
                        ),
                );

                setLessons(
                    (data.lessons ?? [])
                        .slice()
                        .sort(
                            (a, b) =>
                                a.number -
                                b.number,
                        ),
                );
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load course.",
                );
            } finally {
                setLoading(false);
            }
        }, [courseId]);

    useEffect(() => {
        if (
            courseId &&
            !Number.isNaN(courseId)
        ) {
            void loadCourse();
        }
    }, [
        courseId,
        loadCourse,
    ]);

    async function loadLessonProgress(
        lessonId: number,
    ) {
        try {
            const result =
                await api<Progress>(
                    `/lesson-progress/${lessonId}`,
                );

            setProgress(
                (current) => ({
                    ...current,
                    [lessonId]:
                    result,
                }),
            );
        } catch {
            // A missing progress record
            // simply means the lesson
            // has not been started.
        }
    }

    useEffect(() => {
        if (lessons.length === 0) {
            return;
        }

        lessons.forEach(
            (lesson) => {
                void loadLessonProgress(
                    lesson.id,
                );
            },
        );
    }, [lessons]);

    if (loading) {
        return (
            <ProtectedRoute>
                <main className="flex min-h-screen items-center justify-center bg-zinc-50">
                    <div className="text-center">
                        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />

                        <p className="mt-4 text-sm text-zinc-500">
                            Loading course...
                        </p>
                    </div>
                </main>
            </ProtectedRoute>
        );
    }

    if (error || !course) {
        return (
            <ProtectedRoute>
                <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
                    <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 text-center">
                        <h1 className="text-xl font-bold text-zinc-900">
                            Course unavailable
                        </h1>

                        <p className="mt-3 text-sm text-red-600">
                            {error ??
                                "Course not found."}
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                void loadCourse()
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
                        href="/courses"
                        className="text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
                    >
                        ← All courses
                    </Link>

                    <section className="mt-8 rounded-3xl bg-zinc-900 p-8 text-white sm:p-12">
                        <p className="text-sm font-medium uppercase tracking-wider text-zinc-400">
                            Course
                        </p>

                        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
                            {course.title}
                        </h1>

                        {course.description && (
                            <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-300">
                                {
                                    course.description
                                }
                            </p>
                        )}

                        <div className="mt-8 flex flex-wrap gap-3">
                            <div className="rounded-full bg-white/10 px-4 py-2 text-sm">
                                {units.length}{" "}
                                units
                            </div>

                            <div className="rounded-full bg-white/10 px-4 py-2 text-sm">
                                {lessons.length}{" "}
                                lessons
                            </div>
                        </div>
                    </section>

                    <section className="mt-10">
                        <div className="mb-6">
                            <p className="text-sm font-medium uppercase tracking-wider text-zinc-400">
                                Curriculum
                            </p>

                            <h2 className="mt-2 text-2xl font-bold text-zinc-900">
                                Your learning path
                            </h2>
                        </div>

                        {units.length === 0 ? (
                            <div className="rounded-3xl border border-zinc-200 bg-white p-10 text-center">
                                <h3 className="font-semibold text-zinc-900">
                                    No units yet
                                </h3>

                                <p className="mt-2 text-sm text-zinc-500">
                                    This course does not
                                    have any published
                                    units yet.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {units.map(
                                    (
                                        unit,
                                    ) => {
                                        const unitLessons =
                                            lessons
                                                .filter(
                                                    (
                                                        lesson,
                                                    ) =>
                                                        lesson.unitId ===
                                                        unit.id,
                                                )
                                                .sort(
                                                    (
                                                        a,
                                                        b,
                                                    ) =>
                                                        a.number -
                                                        b.number,
                                                );

                                        return (
                                            <section
                                                key={
                                                    unit.id
                                                }
                                                className="overflow-hidden rounded-3xl border border-zinc-200 bg-white"
                                            >
                                                <div className="border-b border-zinc-100 p-6 sm:p-8">
                                                    <div className="flex items-start gap-4">
                                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 font-bold text-white">
                                                            {
                                                                unit.number
                                                            }
                                                        </div>

                                                        <div>
                                                            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                                                                Unit{" "}
                                                                {
                                                                    unit.number
                                                                }
                                                            </p>

                                                            <h3 className="mt-1 text-xl font-bold text-zinc-900">
                                                                {
                                                                    unit.title
                                                                }
                                                            </h3>

                                                            {unit.description && (
                                                                <p className="mt-2 text-sm leading-6 text-zinc-500">
                                                                    {
                                                                        unit.description
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="divide-y divide-zinc-100">
                                                    {unitLessons.length ===
                                                    0 ? (
                                                        <div className="p-6 text-sm text-zinc-500">
                                                            No lessons
                                                            available.
                                                        </div>
                                                    ) : (
                                                        unitLessons.map(
                                                            (
                                                                lesson,
                                                            ) => {
                                                                const lessonProgress =
                                                                    progress[
                                                                        lesson
                                                                            .id
                                                                        ];

                                                                const percentage =
                                                                    Math.min(
                                                                        100,
                                                                        Math.max(
                                                                            0,
                                                                            lessonProgress?.progress ??
                                                                            0,
                                                                        ),
                                                                    );

                                                                const completed =
                                                                    lessonProgress?.status ===
                                                                    "completed" ||
                                                                    percentage >=
                                                                    100;

                                                                return (
                                                                    <Link
                                                                        key={
                                                                            lesson.id
                                                                        }
                                                                        href={`/lessons/${lesson.id}/learn`}
                                                                        className="group block p-6 transition hover:bg-zinc-50 sm:px-8"
                                                                    >
                                                                        <div className="flex items-center gap-4">
                                                                            <div
                                                                                className={[
                                                                                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition",
                                                                                    completed
                                                                                        ? "border-zinc-900 bg-zinc-900 text-white"
                                                                                        : "border-zinc-200 bg-white text-zinc-600 group-hover:border-zinc-900",
                                                                                ].join(
                                                                                    " ",
                                                                                )}
                                                                            >
                                                                                {completed
                                                                                    ? "✓"
                                                                                    : lesson.number}
                                                                            </div>

                                                                            <div className="min-w-0 flex-1">
                                                                                <div className="flex items-center justify-between gap-4">
                                                                                    <div>
                                                                                        <h4 className="font-semibold text-zinc-900">
                                                                                            {
                                                                                                lesson.title
                                                                                            }
                                                                                        </h4>

                                                                                        {lesson.description && (
                                                                                            <p className="mt-1 line-clamp-1 text-sm text-zinc-500">
                                                                                                {
                                                                                                    lesson.description
                                                                                                }
                                                                                            </p>
                                                                                        )}
                                                                                    </div>

                                                                                    <span className="shrink-0 text-sm text-zinc-400 transition group-hover:text-zinc-900">
                                                                                        →
                                                                                    </span>
                                                                                </div>

                                                                                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                                                                                    <div
                                                                                        className="h-full rounded-full bg-zinc-900 transition-all"
                                                                                        style={{
                                                                                            width: `${percentage}%`,
                                                                                        }}
                                                                                    />
                                                                                </div>

                                                                                {percentage >
                                                                                    0 &&
                                                                                    !completed && (
                                                                                        <p className="mt-1.5 text-xs text-zinc-400">
                                                                                            {percentage}
                                                                                            %
                                                                                            complete
                                                                                        </p>
                                                                                    )}
                                                                            </div>
                                                                        </div>
                                                                    </Link>
                                                                );
                                                            },
                                                        )
                                                    )}
                                                </div>
                                            </section>
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