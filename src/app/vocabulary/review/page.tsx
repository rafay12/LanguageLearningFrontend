"use client";

import {
    useCallback,
    useEffect,
    useState,
} from "react";

import ProtectedRoute from "@/components/ProtectedRoute";
import { api } from "@/lib/api";

import VocabularyReview, {
    VocabularyReviewResult,
} from "@/components/vocabulary/VocabularyReview";

interface VocabularyItem {
    id: number;
    word: string;
    translation: string;
    pronunciation?: string | null;
    example?: string | null;
    audioUrl?: string | null;
}

export default function VocabularyReviewPage() {
    const [items, setItems] =
        useState<VocabularyItem[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const loadReview =
        useCallback(async () => {
            try {
                setLoading(true);
                setError(null);

                const data =
                    await api<VocabularyItem[]>(
                        "/vocabulary/review",
                    );

                setItems(data);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load review.",
                );
            } finally {
                setLoading(false);
            }
        }, []);

    useEffect(() => {
        void loadReview();
    }, [loadReview]);

    async function handleComplete(
        result: VocabularyReviewResult,
    ) {
        try {
            await api(
                "/vocabulary/review",
                {
                    method: "POST",
                    body: JSON.stringify({
                        total:
                        result.total,
                        known:
                        result.known,
                        learning:
                        result.learning,
                    }),
                },
            );
        } catch {
            console.warn(
                "Unable to save vocabulary review.",
            );
        }
    }

    if (loading) {
        return (
            <ProtectedRoute>
                <main className="min-h-screen bg-zinc-50">
                    <div className="mx-auto max-w-3xl px-6 py-10">
                        <div className="h-[500px] animate-pulse rounded-3xl bg-zinc-200" />
                    </div>
                </main>
            </ProtectedRoute>
        );
    }

    if (error) {
        return (
            <ProtectedRoute>
                <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
                    <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 text-center">
                        <h1 className="text-xl font-bold text-zinc-900">
                            Review unavailable
                        </h1>

                        <p className="mt-3 text-sm text-red-600">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                void loadReview()
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
                <div className="mx-auto max-w-3xl px-6 py-10">
                    <VocabularyReview
                        items={items}
                        onComplete={
                            handleComplete
                        }
                    />
                </div>
            </main>
        </ProtectedRoute>
    );
}