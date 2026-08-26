"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import ProtectedRoute from "@/components/ProtectedRoute";
import { api } from "@/lib/api";

import LanguageCard from "@/components/languages/LanguageCard";

interface Language {
    id: number;
    name: string;
    nativeName?: string | null;
    code?: string | null;
    description?: string | null;
    isActive?: boolean;
}

export default function LanguagesPage() {
    const [languages, setLanguages] =
        useState<Language[]>([]);

    const [search, setSearch] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const loadLanguages =
        useCallback(async () => {
            try {
                setLoading(true);
                setError(null);

                const data =
                    await api<Language[]>(
                        "/languages",
                    );

                setLanguages(
                    data.filter(
                        (language) =>
                            language.isActive !==
                            false,
                    ),
                );
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load languages.",
                );
            } finally {
                setLoading(false);
            }
        }, []);

    useEffect(() => {
        void loadLanguages();
    }, [loadLanguages]);

    const filteredLanguages =
        useMemo(() => {
            const query =
                search
                    .trim()
                    .toLowerCase();

            if (!query) {
                return languages;
            }

            return languages.filter(
                (language) =>
                    language.name
                        .toLowerCase()
                        .includes(query) ||
                    language.nativeName
                        ?.toLowerCase()
                        .includes(query) ||
                    language.code
                        ?.toLowerCase()
                        .includes(query),
            );
        }, [
            languages,
            search,
        ]);

    return (
        <ProtectedRoute>
            <main className="min-h-screen bg-zinc-50">
                <div className="mx-auto max-w-7xl px-6 py-10">
                    <header>
                        <p className="text-sm font-medium uppercase tracking-wider text-zinc-400">
                            Languages
                        </p>

                        <h1 className="mt-2 text-4xl font-bold tracking-tight text-zinc-900">
                            What do you want to learn?
                        </h1>

                        <p className="mt-3 max-w-2xl text-zinc-500">
                            Choose a language to explore
                            available courses and lessons.
                        </p>
                    </header>

                    <div className="mt-8">
                        <input
                            type="search"
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value,
                                )
                            }
                            placeholder="Search languages..."
                            className="w-full rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 sm:max-w-xl"
                        />
                    </div>

                    {loading && (
                        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {Array.from({
                                length: 8,
                            }).map(
                                (_, index) => (
                                    <div
                                        key={
                                            index
                                        }
                                        className="h-56 animate-pulse rounded-3xl bg-zinc-200"
                                    />
                                ),
                            )}
                        </div>
                    )}

                    {!loading &&
                        error && (
                            <div className="mt-10 rounded-3xl border border-red-200 bg-white p-8">
                                <p className="text-sm text-red-600">
                                    {error}
                                </p>

                                <button
                                    type="button"
                                    onClick={() =>
                                        void loadLanguages()
                                    }
                                    className="mt-5 rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white"
                                >
                                    Try again
                                </button>
                            </div>
                        )}

                    {!loading &&
                        !error &&
                        filteredLanguages.length ===
                        0 && (
                            <div className="mt-10 rounded-3xl border border-zinc-200 bg-white p-12 text-center">
                                <h2 className="text-xl font-bold text-zinc-900">
                                    No languages found
                                </h2>

                                <p className="mt-2 text-sm text-zinc-500">
                                    Try another search.
                                </p>
                            </div>
                        )}

                    {!loading &&
                        !error &&
                        filteredLanguages.length >
                        0 && (
                            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {filteredLanguages.map(
                                    (
                                        language,
                                    ) => (
                                        <LanguageCard
                                            key={
                                                language.id
                                            }
                                            id={
                                                language.id
                                            }
                                            name={
                                                language.name
                                            }
                                            nativeName={
                                                language.nativeName
                                            }
                                            code={
                                                language.code
                                            }
                                            description={
                                                language.description
                                            }
                                        />
                                    ),
                                )}
                            </div>
                        )}
                </div>
            </main>
        </ProtectedRoute>
    );
}