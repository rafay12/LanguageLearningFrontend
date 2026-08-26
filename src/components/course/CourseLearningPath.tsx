"use client";

import Link from "next/link";

interface Lesson {
    id: number;
    title: string;
    description?: string | null;
    number?: number | null;
}

interface Unit {
    id: number;
    title: string;
    description?: string | null;
    number?: number | null;
    lessons: Lesson[];
}

interface LessonProgress {
    lessonId: number;
    status?: string | null;
    progress?: number | null;
    score?: number | null;
}

interface CourseLearningPathProps {
    units: Unit[];
    progress: LessonProgress[];
}

function getLessonProgress(
    lessonId: number,
    progress: LessonProgress[],
) {
    return progress.find(
        (item) => item.lessonId === lessonId,
    );
}

export default function CourseLearningPath({
                                               units,
                                               progress,
                                           }: CourseLearningPathProps) {
    return (
        <div className="space-y-8">
            {units.map((unit, unitIndex) => (
                <section key={unit.id}>
                    <div className="mb-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                            Unit {unit.number ?? unitIndex + 1}
                        </p>

                        <h2 className="mt-1 text-xl font-bold text-zinc-900">
                            {unit.title}
                        </h2>

                        {unit.description && (
                            <p className="mt-1 text-sm text-zinc-500">
                                {unit.description}
                            </p>
                        )}
                    </div>

                    <div className="space-y-3">
                        {unit.lessons.map((lesson, lessonIndex) => {
                            const lessonProgress = getLessonProgress(
                                lesson.id,
                                progress,
                            );

                            const status =
                                lessonProgress?.status ?? "not_started";

                            const completed =
                                status === "completed";

                            const started =
                                status === "in_progress" ||
                                status === "started";

                            return (
                                <Link
                                    key={lesson.id}
                                    href={`/lessons/${lesson.id}/learn`}
                                    className="block"
                                >
                                    <div className="rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-400 hover:shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div
                                                className={[
                                                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                                                    completed
                                                        ? "bg-zinc-900 text-white"
                                                        : started
                                                            ? "border-2 border-zinc-900 text-zinc-900"
                                                            : "bg-zinc-100 text-zinc-500",
                                                ].join(" ")}
                                            >
                                                {completed
                                                    ? "✓"
                                                    : lesson.number ??
                                                    lessonIndex + 1}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-semibold text-zinc-900">
                                                    {lesson.title}
                                                </h3>

                                                {lesson.description && (
                                                    <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                                                        {lesson.description}
                                                    </p>
                                                )}

                                                {lessonProgress?.progress != null &&
                                                    !completed && (
                                                        <div className="mt-3">
                                                            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
                                                                <div
                                                                    className="h-full rounded-full bg-zinc-900"
                                                                    style={{
                                                                        width: `${Math.min(
                                                                            100,
                                                                            Math.max(
                                                                                0,
                                                                                lessonProgress.progress,
                                                                            ),
                                                                        )}%`,
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                            </div>

                                            <div className="text-zinc-400">
                                                →
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </section>
            ))}
        </div>
    );
}