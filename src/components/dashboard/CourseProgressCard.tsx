"use client";

import Link from "next/link";

interface CourseProgressCardProps {
    courseId: number;
    title: string;
    description?: string | null;
    totalLessons: number;
    completedLessons: number;
}

export default function CourseProgressCard({
                                               courseId,
                                               title,
                                               description,
                                               totalLessons,
                                               completedLessons,
                                           }: CourseProgressCardProps) {
    const percentage =
        totalLessons > 0
            ? Math.round(
                (completedLessons /
                    totalLessons) *
                100,
            )
            : 0;

    return (
        <Link
            href={`/courses/${courseId}`}
            className="group block rounded-3xl border border-zinc-200 bg-white p-6 transition hover:-translate-y-1 hover:border-zinc-300 hover:shadow-lg"
        >
            <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-900 font-bold text-white">
                    {title.charAt(0).toUpperCase()}
                </div>

                <span className="text-zinc-400 transition group-hover:translate-x-1 group-hover:text-zinc-900">
                    →
                </span>
            </div>

            <h3 className="mt-6 text-xl font-bold text-zinc-900">
                {title}
            </h3>

            {description && (
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-500">
                    {description}
                </p>
            )}

            <div className="mt-6 flex items-center justify-between text-sm">
                <span className="text-zinc-500">
                    {completedLessons} /{" "}
                    {totalLessons} lessons
                </span>

                <span className="font-semibold text-zinc-900">
                    {percentage}%
                </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100">
                <div
                    className="h-full rounded-full bg-zinc-900 transition-all"
                    style={{
                        width: `${percentage}%`,
                    }}
                />
            </div>
        </Link>
    );
}