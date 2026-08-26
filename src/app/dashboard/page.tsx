"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
    getCurrentUser,
    getToken,
    logout,
    type User,
} from "@/lib/auth";

import {
    getLanguages,
    type Language,
} from "@/lib/languages";

export default function DashboardPage() {
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null);
    const [languages, setLanguages] = useState<Language[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadDashboard() {
            const token = getToken();

            if (!token) {
                router.replace("/login");
                return;
            }

            try {
                const [currentUser, availableLanguages] =
                    await Promise.all([
                        getCurrentUser(),
                        getLanguages(),
                    ]);

                setUser(currentUser);
                setLanguages(availableLanguages);
            } catch (err) {
                console.error(err);

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load dashboard",
                );
            } finally {
                setLoading(false);
            }
        }

        loadDashboard();
    }, [router]);

    function handleLogout() {
        logout();
        router.replace("/login");
    }

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="text-gray-500">
                    Loading your dashboard...
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">
                    {error}
                </div>
            </main>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <main className="min-h-screen bg-gray-50">

            {/* Header */}
            <header className="border-b bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

                    <div>
                        <h1 className="text-2xl font-bold">
                            LingoLearn
                        </h1>

                        <p className="text-sm text-gray-500">
                            Language learning platform
                        </p>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
                    >
                        Log out
                    </button>

                </div>
            </header>

            {/* Content */}
            <div className="mx-auto max-w-7xl px-6 py-10">

                {/* Welcome */}
                <section className="mb-10">

                    <p className="text-sm font-medium text-gray-500">
                        Welcome back
                    </p>

                    <h2 className="mt-1 text-4xl font-bold tracking-tight">
                        {user.name}
                    </h2>

                    <p className="mt-2 text-gray-600">
                        Choose a language and start learning.
                    </p>

                </section>

                {/* Languages */}
                <section>

                    <div className="mb-5">
                        <h3 className="text-2xl font-bold">
                            Learn a language
                        </h3>

                        <p className="mt-1 text-gray-500">
                            Select the language you want to learn.
                        </p>
                    </div>

                    {languages.length === 0 ? (
                        <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
                            No languages available yet.
                        </div>
                    ) : (
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

                            {languages.map((language) => (
                                <button
                                    key={language.id}
                                    onClick={() =>
                                        router.push(
                                            `/languages/${language.id}`,
                                        )
                                    }
                                    className="group rounded-2xl border bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                                >

                                    <div className="flex items-center justify-between">

                                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 text-2xl font-bold">
                                            {language.name
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>

                                        <span className="text-gray-400 transition group-hover:translate-x-1">
                      →
                    </span>

                                    </div>

                                    <h4 className="mt-6 text-xl font-bold">
                                        {language.name}
                                    </h4>

                                    <p className="mt-1 text-sm text-gray-500">
                                        Start learning {language.name}
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