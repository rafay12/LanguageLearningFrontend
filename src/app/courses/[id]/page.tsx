"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface Course {
    id: number;
    title: string;
    description?: string | null;
    type?: string | null;
    number?: number | null;
    isActive?: boolean;
}

interface Lesson {
    id: number;
    title: string;
    description?: string | null;
    number?: number | null;
    isActive?: boolean;
}

interface Unit {
    id: number;
    title: string;
    description?: string | null;
    number?: number | null;
    isActive?: boolean;
    lessons: Lesson[];
}

interface LessonProgress {
    id?: number;
    lessonId: number;
    status?: string | null;
    progress?: number | null;
    score?: number | null;
    startedAt?: string;
    completedAt?: string;
}

interface EnrollmentStatus {
    enrolled: boolean;
}

interface CourseProgress {
    courseId: number;
    totalLessons: number;
    completedLessons: number;
    progress: number;
}

export default function CoursePage() {
    const params = useParams();
    const router = useRouter();

    const courseId = params.id as string;

    const [course, setCourse] = useState<Course | null>(null);
    const [units, setUnits] = useState<Unit[]>([]);
    const [lessonProgress, setLessonProgress] = useState<
        LessonProgress[]
    >([]);

    const [courseProgress, setCourseProgress] =
        useState<CourseProgress | null>(null);

    const [enrolled, setEnrolled] = useState(false);
    const [enrolling, setEnrolling] = useState(false);

    const [loading, setLoading] = useState(true);
    const [progressLoading, setProgressLoading] =
        useState(false);

    const [error, setError] = useState("");

    useEffect(() => {
        async function loadCourse() {
            try {
                setLoading(true);
                setError("");

                /*
                 * Load course and units.
                 */
                const [courseData, unitsData] = await Promise.all([
                    api<Course>(`/courses/${courseId}`),
                    api<Unit[]>(`/units/course/${courseId}`),
                ]);

                /*
                 * Load lessons for every unit.
                 */
                const unitsWithLessons = await Promise.all(
                    unitsData.map(async (unit) => {
                        const lessons = await api<Lesson[]>(
                            `/lessons/unit/${unit.id}`,
                        );

                        return {
                            ...unit,
                            lessons,
                        };
                    }),
                );

                setCourse(courseData);
                setUnits(unitsWithLessons);

                /*
                 * Load authenticated user's information.
                 */
                try {
                    setProgressLoading(true);

                    const userData = await api<{
                        id: number;
                    }>("/auth/me");

                    /*
                     * Load lesson progress.
                     */
                    try {
                        const progress =
                            await api<LessonProgress[]>(
                                `/lesson-progress/user/${userData.id}`,
                            );

                        setLessonProgress(progress);
                    } catch (progressError) {
                        console.error(
                            "Unable to load lesson progress:",
                            progressError,
                        );

                        setLessonProgress([]);
                    }

                    /*
                     * Check whether the user is enrolled.
                     */
                    try {
                        const enrollment =
                            await api<EnrollmentStatus>(
                                `/enrollments/check?userId=${userData.id}&courseId=${courseId}`,
                            );

                        setEnrolled(enrollment.enrolled);

                        /*
                         * Only request course progress if
                         * the user is actually enrolled.
                         */
                        if (enrollment.enrolled) {
                            try {
                                const progress =
                                    await api<CourseProgress>(
                                        `/enrollments/progress?courseId=${courseId}`,
                                    );

                                setCourseProgress(progress);
                            } catch (courseProgressError) {
                                console.error(
                                    "Unable to load course progress:",
                                    courseProgressError,
                                );

                                setCourseProgress(null);
                            }
                        } else {
                            setCourseProgress(null);
                        }
                    } catch (enrollmentError) {
                        console.error(
                            "Unable to check enrollment:",
                            enrollmentError,
                        );

                        setEnrolled(false);
                        setCourseProgress(null);
                    }
                } catch (authError) {
                    /*
                     * The course itself remains viewable
                     * even when the user isn't authenticated.
                     */
                    console.error(
                        "Unable to load authenticated user:",
                        authError,
                    );

                    setLessonProgress([]);
                    setEnrolled(false);
                    setCourseProgress(null);
                } finally {
                    setProgressLoading(false);
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

    /*
     * Enroll the authenticated user in this course.
     */
    async function handleEnroll() {
        try {
            setEnrolling(true);
            setError("");

            await api("/enrollments", {
                method: "POST",
                body: JSON.stringify({
                    courseId: Number(courseId),
                }),
            });

            setEnrolled(true);

            /*
             * Refresh course progress after enrollment.
             */
            try {
                const progress =
                    await api<CourseProgress>(
                        `/enrollments/progress?courseId=${courseId}`,
                    );

                setCourseProgress(progress);
            } catch (progressError) {
                console.error(
                    "Unable to load course progress after enrollment:",
                    progressError,
                );

                setCourseProgress(null);
            }
        } catch (error) {
            console.error(error);

            setError(
                error instanceof Error
                    ? error.message
                    : "Unable to enroll in course.",
            );
        } finally {
            setEnrolling(false);
        }
    }

    /*
     * Find progress belonging to a specific lesson.
     */
    function getLessonProgress(lessonId: number) {
        return lessonProgress.find(
            (item) => item.lessonId === lessonId,
        );
    }

    /*
     * All lessons in the course.
     */
    const allLessons = units.flatMap(
        (unit) => unit.lessons,
    );

    /*
     * Backend is the source of truth for course progress.
     */
    const completedLessons =
        courseProgress?.completedLessons ?? 0;

    const totalLessons =
        courseProgress?.totalLessons ?? allLessons.length;

    const progressPercentage =
        courseProgress?.progress ?? 0;

    /*
     * Find the first lesson that hasn't been completed.
     */
    function getContinueLesson() {
        const incompleteLesson = allLessons.find(
            (lesson) => {
                const progress = getLessonProgress(
                    lesson.id,
                );

                return progress?.status !== "completed";
            },
        );

        return (
            incompleteLesson ??
            allLessons[0] ??
            null
        );
    }

    /*
     * Continue learning.
     */
    function handleContinueLearning() {
        const lesson = getContinueLesson();

        if (!lesson) {
            return;
        }

        router.push(
            `/lessons/${lesson.id}/learn`,
        );
    }

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-zinc-50">
                <p className="text-sm text-zinc-500">
                    Loading course...
                </p>
            </main>
        );
    }

    if (error && !course) {
        return (
            <main className="min-h-screen bg-zinc-50 px-6 py-12">
                <div className="mx-auto max-w-5xl">
                    <button
                        onClick={() => router.back()}
                        className="mb-8 text-sm font-medium text-zinc-600 hover:text-zinc-900"
                    >
                        ← Back
                    </button>

                    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
                        {error}
                    </div>
                </div>
            </main>
        );
    }

    if (!course) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-zinc-50">
                <p className="text-sm text-zinc-500">
                    Course not found.
                </p>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-zinc-50 text-zinc-900">
            {/* Header */}
            <header className="border-b border-zinc-200 bg-white">
                <div className="mx-auto flex h-16 max-w-7xl items-center px-6">
                    <button
                        onClick={() => router.back()}
                        className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
                    >
                        ← Back
                    </button>

                    <div className="ml-6 text-xl font-bold">
                        LingoLearn
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-6xl px-6 py-12">
                {/* Course header */}
                <section className="rounded-3xl border border-zinc-200 bg-white p-8">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-zinc-100 text-3xl font-bold">
                            {course.number ?? "→"}
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium uppercase tracking-wider text-zinc-400">
                                Course
                            </p>

                            <h1 className="mt-1 text-4xl font-bold">
                                {course.title}
                            </h1>

                            {course.description && (
                                <p className="mt-3 max-w-2xl text-zinc-600">
                                    {course.description}
                                </p>
                            )}

                            {course.type && (
                                <span className="mt-4 inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
                                    {course.type}
                                </span>
                            )}

                            {/* Enrollment button */}
                            <div className="mt-6">
                                {enrolled ? (
                                    <button
                                        type="button"
                                        onClick={
                                            handleContinueLearning
                                        }
                                        disabled={
                                            allLessons.length === 0
                                        }
                                        className="rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Continue Learning →
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleEnroll}
                                        disabled={
                                            enrolling ||
                                            allLessons.length === 0
                                        }
                                        className="rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {enrolling
                                            ? "Starting..."
                                            : "Start Learning"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Error after enrollment */}
                    {error && (
                        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Course progress */}
                    <div className="mt-8 border-t border-zinc-100 pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold">
                                    Your progress
                                </p>

                                <p className="mt-1 text-sm text-zinc-500">
                                    {completedLessons} of{" "}
                                    {totalLessons} lessons completed
                                </p>
                            </div>

                            <span className="text-2xl font-bold">
                                {progressPercentage}%
                            </span>
                        </div>

                        <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-100">
                            <div
                                className="h-full rounded-full bg-zinc-900 transition-all"
                                style={{
                                    width: `${Math.min(
                                        100,
                                        Math.max(
                                            0,
                                            progressPercentage,
                                        ),
                                    )}%`,
                                }}
                            />
                        </div>
                    </div>
                </section>

                {/* Units */}
                <section className="mt-12">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold">
                            Course Units
                        </h2>

                        <p className="mt-2 text-zinc-500">
                            Work through each lesson to continue
                            your learning.
                        </p>
                    </div>

                    {progressLoading && (
                        <p className="mb-4 text-sm text-zinc-400">
                            Loading your progress...
                        </p>
                    )}

                    {units.length === 0 ? (
                        <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center">
                            <h3 className="font-semibold">
                                No units available
                            </h3>

                            <p className="mt-2 text-sm text-zinc-500">
                                This course does not have any units
                                yet.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {units.map(
                                (unit, unitIndex) => (
                                    <section
                                        key={unit.id}
                                    >
                                        <div className="mb-4">
                                            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                                Unit{" "}
                                                {unit.number ??
                                                    unitIndex +
                                                    1}
                                            </p>

                                            <h3 className="mt-1 text-xl font-bold">
                                                {unit.title}
                                            </h3>

                                            {unit.description && (
                                                <p className="mt-1 text-sm text-zinc-500">
                                                    {
                                                        unit.description
                                                    }
                                                </p>
                                            )}
                                        </div>

                                        {unit.lessons
                                            .length ===
                                        0 ? (
                                            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-500">
                                                No lessons
                                                available.
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {unit.lessons.map(
                                                    (
                                                        lesson,
                                                        lessonIndex,
                                                    ) => {
                                                        const progress =
                                                            getLessonProgress(
                                                                lesson.id,
                                                            );

                                                        const completed =
                                                            progress?.status ===
                                                            "completed";

                                                        const started =
                                                            progress?.status ===
                                                            "in_progress" ||
                                                            progress?.status ===
                                                            "started";

                                                        const progressValue =
                                                            progress?.progress ??
                                                            0;

                                                        return (
                                                            <button
                                                                key={
                                                                    lesson.id
                                                                }
                                                                type="button"
                                                                onClick={() =>
                                                                    router.push(
                                                                        `/lessons/${lesson.id}/learn`,
                                                                    )
                                                                }
                                                                className="group flex w-full items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-5 text-left transition hover:border-zinc-400 hover:shadow-sm"
                                                            >
                                                                {/* Lesson number/status */}
                                                                <div
                                                                    className={[
                                                                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                                                                        completed
                                                                            ? "bg-zinc-900 text-white"
                                                                            : started
                                                                                ? "border-2 border-zinc-900 text-zinc-900"
                                                                                : "bg-zinc-100 text-zinc-500",
                                                                    ].join(
                                                                        " ",
                                                                    )}
                                                                >
                                                                    {completed
                                                                        ? "✓"
                                                                        : lesson.number ??
                                                                        lessonIndex +
                                                                        1}
                                                                </div>

                                                                {/* Lesson information */}
                                                                <div className="min-w-0 flex-1">
                                                                    <h4 className="font-semibold">
                                                                        {
                                                                            lesson.title
                                                                        }
                                                                    </h4>

                                                                    {lesson.description && (
                                                                        <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                                                                            {
                                                                                lesson.description
                                                                            }
                                                                        </p>
                                                                    )}

                                                                    {/* Lesson progress */}
                                                                    {started &&
                                                                        !completed && (
                                                                            <div className="mt-3 flex items-center gap-3">
                                                                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
                                                                                    <div
                                                                                        className="h-full rounded-full bg-zinc-900 transition-all"
                                                                                        style={{
                                                                                            width: `${Math.min(
                                                                                                100,
                                                                                                Math.max(
                                                                                                    0,
                                                                                                    progressValue,
                                                                                                ),
                                                                                            )}%`,
                                                                                        }}
                                                                                    />
                                                                                </div>

                                                                                <span className="text-xs font-medium text-zinc-500">
                                                                                    {progressValue}
                                                                                    %
                                                                                </span>
                                                                            </div>
                                                                        )}

                                                                    {/* Completed label */}
                                                                    {completed && (
                                                                        <p className="mt-2 text-xs font-medium text-zinc-500">
                                                                            Completed
                                                                        </p>
                                                                    )}

                                                                    {/* Started label */}
                                                                    {started &&
                                                                        !completed && (
                                                                            <p className="mt-2 text-xs font-medium text-zinc-500">
                                                                                In
                                                                                progress
                                                                            </p>
                                                                        )}
                                                                </div>

                                                                {/* Arrow */}
                                                                <div className="shrink-0 text-zinc-400 transition group-hover:translate-x-1 group-hover:text-zinc-900">
                                                                    →
                                                                </div>
                                                            </button>
                                                        );
                                                    },
                                                )}
                                            </div>
                                        )}
                                    </section>
                                ),
                            )}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}