"use client";

interface LearningStatsProps {
    lessonsCompleted: number;
    lessonsStarted: number;
    totalLessons: number;
    averageProgress: number;
    xp: number;
    streak: number;
}

interface StatCardProps {
    label: string;
    value: string | number;
    description: string;
}

function StatCard({
                      label,
                      value,
                      description,
                  }: StatCardProps) {
    return (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6">
            <p className="text-sm font-medium text-zinc-500">
                {label}
            </p>

            <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
                {value}
            </p>

            <p className="mt-1 text-xs text-zinc-400">
                {description}
            </p>
        </div>
    );
}

export default function LearningStats({
                                          lessonsCompleted,
                                          lessonsStarted,
                                          totalLessons,
                                          averageProgress,
                                          xp,
                                          streak,
                                      }: LearningStatsProps) {
    return (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard
                label="Completed"
                value={lessonsCompleted}
                description="Lessons finished"
            />

            <StatCard
                label="Started"
                value={lessonsStarted}
                description="Lessons started"
            />

            <StatCard
                label="Lessons"
                value={totalLessons}
                description="Available lessons"
            />

            <StatCard
                label="Progress"
                value={`${averageProgress}%`}
                description="Overall progress"
            />

            <StatCard
                label="XP"
                value={xp}
                description="Experience earned"
            />

            <StatCard
                label="Streak"
                value={`${streak} days`}
                description="Current learning streak"
            />
        </section>
    );
}