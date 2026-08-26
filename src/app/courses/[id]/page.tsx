"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

interface Unit {
    id: number;
    title: string;
    description?: string | null;
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

interface LessonProgress {
    id?: number;
    lessonId: number;
    userId?: number;
    status?: string | null;
    progress?: number | null;
    score?: number | null;
    completedAt?: string | null;
}

interface UnitWithLessons extends Unit {
    lessons: Lesson[];
}

export default function CoursePage() {
    const params = useParams();
    const router = useRouter();

    const courseId = Number(params.id);

    const [course, setCourse] =
        useState<Course | null>(null);

    const [units, setUnits] =
        useState<UnitWithLessons[]>([]);

    const [progress, setProgress] =
        useState<LessonProgress[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [expandedUnits, setExpandedUnits] =
        useState<Record<number, boolean>>({});

    useEffect(() => {
        if (!Number.isFinite(courseId)) {
            setError("Invalid course.");
            setLoading(false);
            return;
        }

        async function loadCourse() {
            try {
                setLoading(true);
                setError("");

                const courseData =
                    await api<Course>(
                        `/courses/${courseId}`,
                    );

                setCourse(courseData);

                const unitData =
                    await api<Unit[]>(
                        `/units/course/${courseId}`,
                    );

                const sortedUnits =
                    [...unitData].sort(
                        (a, b) =>
                            (a.number ?? a.id) -
                            (b.number ?? b.id),
                    );

                const unitsWithLessons =
                    await Promise.all(
                        sortedUnits.map(
                            async (unit) => {
                                try {
                                    const lessons =
                                        await api<Lesson[]>(
                                            `/lessons/unit/${unit.id}`,
                                        );

                                    return {
                                        ...unit,
                                        lessons:
                                            [...lessons].sort(
                                                (a, b) =>
                                                    (a.number ??
                                                        a.id) -
                                                    (b.number ??
                                                        b.id),
                                            ),
                                    };
                                } catch {
                                    return {
                                        ...unit,
                                        lessons: [],
                                    };
                                }
                            },
                        ),
                    );

                setUnits(
                    unitsWithLessons,
                );

                /*
                 * Get the user's progress.
                 *
                 * The endpoint is user based, so we first
                 * get the current authenticated user.
                 */
                try {
                    const user =
                        await api<{
                            id: number;
                        }>("/auth/me");

                    const progressData =
                        await api<LessonProgress[]>(
                            `/lesson-progress/user/${user.id}`,
                        );

                    setProgress(
                        progressData,
                    );
                } catch {
                    setProgress([]);
                }

                /*
                 * Open the first unit initially.
                 */
                if (
                    unitsWithLessons.length > 0
                ) {
                    setExpandedUnits({
                        [unitsWithLessons[0].id]:
                            true,
                    });
                }
            } catch (err) {
                console.error(err);

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load course.",
                );
            } finally {
                setLoading(false);
            }
        }

        loadCourse();
    }, [courseId]);

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

    const allLessons = useMemo(
        () =>
            units.flatMap(
                (unit) => unit.lessons,
            ),
        [units],
    );

    const completedLessons =
        allLessons.filter((lesson) => {
            const item =
                progressMap.get(lesson.id);

            return (
                item?.status ===
                "COMPLETED" ||
                Boolean(item?.completedAt)
            );
        }).length;

    const totalLessons =
        allLessons.length;

    const courseProgress =
        totalLessons > 0
            ? Math.round(
                (completedLessons /
                    totalLessons) *
                100,
            )
            : 0;

    /*
     * Determine which lesson should be available.
     *
     * First lesson is always available.
     * After that, a lesson becomes available
     * after the previous lesson is completed.
     */
    function isLessonUnlocked(
        lessonIndex: number,
    ) {
        if (lessonIndex === 0) {
            return true;
        }

        const previousLesson =
            allLessons[lessonIndex - 1];

        if (!previousLesson) {
            return false;
        }

        const previousProgress =
            progressMap.get(
                previousLesson.id,
            );

        return (
            previousProgress?.status ===
            "COMPLETED" ||
            Boolean(
                previousProgress?.completedAt,
            )
        );
    }

    function toggleUnit(unitId: number) {
        setExpandedUnits((current) => ({
            ...current,
            [unitId]:
                !current[unitId],
        }));
    }

    function getGlobalLessonIndex(
        lessonId: number,
    ) {
        return allLessons.findIndex(
            (lesson) =>
                lesson.id === lessonId,
        );
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-zinc-50">
                <div className="mx-auto max-w-5xl px-6 py-10">
                    <div className="animate-pulse">
                        <div className="h-8 w-64 rounded bg-zinc-200" />
                        <div className="mt-4 h-4 w-96 max-w-full rounded bg-zinc-200" />

                        <div className="mt-10 h-3 rounded-full bg-zinc-200" />

                        <div className="mt-10 space-y-4">
                            {[1, 2, 3].map(
                                (item) => (
                                    <div
                                        key={
                                            item
                                        }
                                        className="h-24 rounded-2xl bg-zinc-200"
                                    />
                                ),
                            )}
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    if (error || !course) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
                <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-xl text-red-500">
                        !
                    </div>

                    <h1 className="mt-5 text-xl font-bold">
                        Unable to load course
                    </h1>

                    <p className="mt-2 text-sm text-zinc-500">
                        {error ||
                            "Course not found."}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            router.back()
                        }
                        className="mt-6 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white"
                    >
                        Go back
                    </button>
                </div>
            </main>
        );
    }

    return (
        <ProtectedRoute>
            <main className="min-h-screen bg-zinc-50 text-zinc-900">
                {/* Header */}
                <header className="border-b border-zinc-200 bg-white">
                    <div className="mx-auto max-w-5xl px-6">
                        <div className="flex h-16 items-center">
                            <Link
                                href="/dashboard"
                                className="text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
                            >
                                ← Dashboard
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Course Hero */}
                <section className="border-b border-zinc-200 bg-white">
                    <div className="mx-auto max-w-5xl px-6 py-10">
                        <div className="max-w-3xl">
                            <div className="flex flex-wrap items-center gap-2">
                                {course.level && (
                                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-600">
                                    {
                                        course.level
                                    }
                                </span>
                                )}

                                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">
                                {
                                    totalLessons
                                }{" "}
                                    lessons
                            </span>
                            </div>

                            <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
                                {course.title}
                            </h1>

                            {course.description && (
                                <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-500">
                                    {
                                        course.description
                                    }
                                </p>
                            )}
                        </div>

                        {/* Progress */}
                        <div className="mt-8 max-w-3xl">
                            <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">
                                Course progress
                            </span>

                                <span className="font-semibold text-zinc-500">
                                {
                                    courseProgress
                                }
                                    %
                            </span>
                            </div>

                            <div className="mt-3 h-3 overflow-hidden rounded-full bg-zinc-100">
                                <div
                                    className="h-full rounded-full bg-zinc-900 transition-all duration-500"
                                    style={{
                                        width: `${courseProgress}%`,
                                    }}
                                />
                            </div>

                            <p className="mt-2 text-xs text-zinc-400">
                                {
                                    completedLessons
                                }{" "}
                                of{" "}
                                {
                                    totalLessons
                                }{" "}
                                lessons completed
                            </p>
                        </div>
                    </div>
                </section>

                {/* Units */}
                <section className="mx-auto max-w-5xl px-6 py-10">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold">
                            Course lessons
                        </h2>

                        <p className="mt-1 text-sm text-zinc-500">
                            Complete each lesson to
                            unlock the next one.
                        </p>
                    </div>

                    {units.length === 0 ? (
                        <div className="rounded-3xl border border-zinc-200 bg-white p-10 text-center">
                            <h3 className="font-semibold">
                                No units yet
                            </h3>

                            <p className="mt-2 text-sm text-zinc-500">
                                This course doesn't
                                contain any units yet.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {units.map(
                                (
                                    unit,
                                    unitIndex,
                                ) => {
                                    const isOpen =
                                        Boolean(
                                            expandedUnits[
                                                unit.id
                                                ],
                                        );

                                    const unitCompleted =
                                        unit.lessons.length >
                                        0 &&
                                        unit.lessons.every(
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
                                        );

                                    return (
                                        <div
                                            key={
                                                unit.id
                                            }
                                            className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm"
                                        >
                                            {/* Unit header */}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    toggleUnit(
                                                        unit.id,
                                                    )
                                                }
                                                className="flex w-full items-center gap-4 p-5 text-left transition hover:bg-zinc-50 sm:p-6"
                                            >
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 text-sm font-bold text-white">
                                                    {
                                                        unitIndex +
                                                        1
                                                    }
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold">
                                                            {
                                                                unit.title
                                                            }
                                                        </h3>

                                                        {unitCompleted && (
                                                            <span className="text-sm">
                                                            ✓
                                                        </span>
                                                        )}
                                                    </div>

                                                    {unit.description && (
                                                        <p className="mt-1 line-clamp-1 text-sm text-zinc-500">
                                                            {
                                                                unit.description
                                                            }
                                                        </p>
                                                    )}

                                                    <p className="mt-2 text-xs text-zinc-400">
                                                        {
                                                            unit.lessons
                                                                .length
                                                        }{" "}
                                                        lessons
                                                    </p>
                                                </div>

                                                <span
                                                    className={[
                                                        "text-zinc-400 transition-transform",
                                                        isOpen
                                                            ? "rotate-180"
                                                            : "",
                                                    ].join(
                                                        " ",
                                                    )}
                                                >
                                                ↓
                                            </span>
                                            </button>

                                            {/* Lessons */}
                                            {isOpen && (
                                                <div className="border-t border-zinc-100">
                                                    {unit.lessons.length ===
                                                    0 ? (
                                                        <div className="p-6 text-sm text-zinc-400">
                                                            No lessons
                                                            available.
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            {unit.lessons.map(
                                                                (
                                                                    lesson,
                                                                ) => {
                                                                    const globalIndex =
                                                                        getGlobalLessonIndex(
                                                                            lesson.id,
                                                                        );

                                                                    const lessonProgress =
                                                                        progressMap.get(
                                                                            lesson.id,
                                                                        );

                                                                    const completed =
                                                                        lessonProgress?.status ===
                                                                        "COMPLETED" ||
                                                                        Boolean(
                                                                            lessonProgress?.completedAt,
                                                                        );

                                                                    const unlocked =
                                                                        isLessonUnlocked(
                                                                            globalIndex,
                                                                        );

                                                                    return (
                                                                        <div
                                                                            key={
                                                                                lesson.id
                                                                            }
                                                                            className="border-b border-zinc-100 last:border-b-0"
                                                                        >
                                                                            {unlocked ? (
                                                                                <Link
                                                                                    href={`/lessons/${lesson.id}/learn`}
                                                                                    className="flex items-center gap-4 p-5 transition hover:bg-zinc-50 sm:px-6"
                                                                                >
                                                                                    <div
                                                                                        className={[
                                                                                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                                                                                            completed
                                                                                                ? "bg-zinc-900 text-white"
                                                                                                : "bg-zinc-100 text-zinc-700",
                                                                                        ].join(
                                                                                            " ",
                                                                                        )}
                                                                                    >
                                                                                        {completed
                                                                                            ? "✓"
                                                                                            : lesson.number ??
                                                                                            globalIndex +
                                                                                            1}
                                                                                    </div>

                                                                                    <div className="min-w-0 flex-1">
                                                                                        <h4 className="font-semibold">
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

                                                                                        {lessonProgress?.progress !=
                                                                                            null &&
                                                                                            !completed && (
                                                                                                <div className="mt-2 flex items-center gap-2">
                                                                                                    <div className="h-1.5 flex-1 max-w-32 overflow-hidden rounded-full bg-zinc-100">
                                                                                                        <div
                                                                                                            className="h-full rounded-full bg-zinc-900"
                                                                                                            style={{
                                                                                                                width: `${Math.min(
                                                                                                                    100,
                                                                                                                    Math.max(
                                                                                                                        0,
                                                                                                                        Number(
                                                                                                                            lessonProgress.progress,
                                                                                                                        ),
                                                                                                                    ),
                                                                                                                )}%`,
                                                                                                            }}
                                                                                                        />
                                                                                                    </div>

                                                                                                    <span className="text-xs text-zinc-400">
                                                                                                    {
                                                                                                        lessonProgress.progress
                                                                                                    }
                                                                                                        %
                                                                                                </span>
                                                                                                </div>
                                                                                            )}
                                                                                    </div>

                                                                                    <span className="text-zinc-400">
                                                                                    →
                                                                                </span>
                                                                                </Link>
                                                                            ) : (
                                                                                <div className="flex items-center gap-4 p-5 opacity-50 sm:px-6">
                                                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm text-zinc-400">
                                                                                        🔒
                                                                                    </div>

                                                                                    <div className="min-w-0 flex-1">
                                                                                        <h4 className="font-semibold">
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

                                                                                        <p className="mt-1 text-xs text-zinc-400">
                                                                                            Complete the
                                                                                            previous
                                                                                            lesson to
                                                                                            unlock
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                },
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                },
                            )}
                        </div>
                    )}
                </section>
            </main>
        </ProtectedRoute>
    );
}