"use client";

import {
    useCallback,
    useEffect,
    useState,
} from "react";

import Link from "next/link";

import ProtectedRoute from "@/components/ProtectedRoute";
import { api } from "@/lib/api";

import VocabularyCard from "@/components/vocabulary/VocabularyCard";

interface VocabularyItem {
    id: number;
    word: string;
    translation: string;
    pronunciation?: string | null;
    partOfSpeech?: string | null;
    example?: string | null;
    audioUrl?: string | null;
}

export default function VocabularyPage() {
    const [items, setItems] =
        useState<VocabularyItem[]>([]);

    const [search, setSearch] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const loadVocabulary =
        useCallback(async () => {
            try {
                setLoading(true);
                setError(null);

                const data =
                    await api<VocabularyItem[]>(
                        "/vocabulary",
                    );

                setItems(data);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load vocabulary.",
                );
            } finally {
                setLoading(false);
            }
        }, []);

    useEffect(() => {
        void loadVocabulary();
    }, [loadVocabulary]);

    const filtered =
        items.filter((item) => {
            const query =
                search
                    .trim()
                    .toLowerCase();

            if (!query) {
                return true;
            }

            return (
                item.word
                    .toLowerCase()
                    .includes(query) ||
                item.translation
                    .toLowerCase()
                    .includes(query)
            );
        });

    return (
        <ProtectedRoute>
            <main className="min-h-screen bg-zinc-50">
                <div className="mx-auto max-w-6xl px-6 py-10">
                    <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                        <div>
                            <p className="text-sm font-medium uppercase tracking-wider text-zinc-400">
                                Vocabulary
                            </p>

                            <h1 className="mt-2 text-4xl font-bold tracking-tight text-zinc-900">
                                Your words
                            </h1>

                            <p className="mt-3 text-zinc-500">
                                Review the vocabulary you've
                                learned.
                            </p>
                        </div>

                        <Link
                            href="/vocabulary/review"
                            className="rounded-2xl bg-zinc-900 px-6 py-3 text-center font-semibold text-white"
                        >
                            Review words →
                        </Link>
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
                            placeholder="Search words or meanings..."
                            className="w-full rounded-2xl border border-zinc-200 bg-white px-5 py-4 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900"
                        />
                    </div>

                    {loading && (
                        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                            {Array.from({
                                length: 6,
                            }).map(
                                (_, index) => (
                                    <div
                                        key={
                                            index
                                        }
                                        className="h-64 animate-pulse rounded-3xl bg-zinc-200"
                                    />
                                ),
                            )}
                        </div>
                    )}

                    {!loading &&
                        error && (
                            <div className="mt-8 rounded-3xl border border-red-200 bg-white p-8">
                                <p className="text-sm text-red-600">
                                    {error}
                                </p>

                                <button
                                    type="button"
                                    onClick={() =>
                                        void loadVocabulary()
                                    }
                                    className="mt-5 rounded-2xl bg-zinc-900 px-5 py-3 font-semibold text-white"
                                >
                                    Try again
                                </button>
                            </div>
                        )}

                    {!loading &&
                        !error &&
                        filtered.length ===
                        0 && (
                            <div className="mt-8 rounded-3xl border border-zinc-200 bg-white p-12 text-center">
                                <h2 className="text-xl font-bold text-zinc-900">
                                    No vocabulary found
                                </h2>

                                <p className="mt-2 text-sm text-zinc-500">
                                    Your vocabulary will appear
                                    here as you learn.
                                </p>
                            </div>
                        )}

                    {!loading &&
                        !error &&
                        filtered.length >
                        0 && (
                            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                                {filtered.map(
                                    (
                                        item,
                                    ) => (
                                        <VocabularyCard
                                            key={
                                                item.id
                                            }
                                            word={
                                                item.word
                                            }
                                            translation={
                                                item.translation
                                            }
                                            pronunciation={
                                                item.pronunciation
                                            }
                                            partOfSpeech={
                                                item.partOfSpeech
                                            }
                                            example={
                                                item.example
                                            }
                                            audioUrl={
                                                item.audioUrl
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