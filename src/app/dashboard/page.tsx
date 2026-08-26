"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface User {
    id: number;
    email: string;
    username?: string;
    name?: string;
}

interface Language {
    id: number;
    code: string;
    name: string;
    nativeName?: string;
}

export default function DashboardPage() {
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null);
    const [languages, setLanguages] = useState<Language[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadDashboard() {
            const token = localStorage.getItem("lingolearn_token");

            if (!token) {
                router.replace("/login");
                return;
            }

            try {
                const [currentUser, availableLanguages] =
                    await Promise.all([
                        api<User>("/auth/me"),
                        api<Language[]>("/languages"),
                    ]);

                setUser(currentUser);
                setLanguages(availableLanguages);
            } catch (err) {
                console.error(err);

                localStorage.removeItem("lingolearn_token");
                router.replace("/login");

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
    }, [router]);

    function logout() {
        localStorage.removeItem("lingolearn_token");
        router.replace("/login");
    }

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-zinc-50">
                <div className="text-sm text-zinc-500">
                    Loading your dashboard...
                </div>
            </main>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <main className="min-h-screen bg-zinc-50 text-zinc-900">
            <header className="border-b border-zinc-200 bg-white">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                    <div className="text-xl font-bold">
                        LingoLearn
                    </div>

                    <button
                        onClick={logout}
                        className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                    >
                        Log out
                    </button>
                </div>
            </header>

            <div className="mx-auto max-w-7xl px-6 py-10">
                <section>
                    <p className="text-sm font-medium text-zinc-500">
                        Welcome back
                    </p>

                    <h1 className="mt-2 text-4xl font-bold tracking-tight">
                        {user.name || user.username || user.email}
                    </h1>

                    <p className="mt-3 text-zinc-600">
                        Choose a language and continue learning.
                    </p>
                </section>

                <section className="mt-12">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold">
                            Languages
                        </h2>

                        <p className="mt-1 text-sm text-zinc-500">
                            Select a language to explore its courses.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {languages.length === 0 ? (
                        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-zinc-500">
                            No languages available.
                        </div>
                    ) : (
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {languages.map((language) => (
                                <button
                                    key={language.id}
                                    onClick={() =>
                                        router.push(`/languages/${language.id}`)
                                    }
                                    className="group rounded-2xl border border-zinc-200 bg-white p-6 text-left transition hover:-translate-y-1 hover:border-zinc-300 hover:shadow-lg"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-xl font-bold">
                                            {language.name.charAt(0).toUpperCase()}
                                        </div>

                                        <span className="text-zinc-400 transition group-hover:translate-x-1 group-hover:text-zinc-700">
                      →
                    </span>
                                    </div>

                                    <h3 className="mt-6 text-xl font-bold">
                                        {language.name}
                                    </h3>

                                    {language.nativeName && (
                                        <p className="mt-1 text-sm text-zinc-500">
                                            {language.nativeName}
                                        </p>
                                    )}

                                    <p className="mt-4 text-sm text-zinc-500">
                                        Explore courses
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}