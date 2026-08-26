"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface Language {
    id: number;
    code: string;
    name: string;
    nativeName?: string;
    description?: string;
}

interface LanguageVariant {
    id: number;
    name: string;
    code?: string;
    description?: string;
}

export default function LanguagePage() {
    const params = useParams();
    const router = useRouter();

    const id = params.id as string;

    const [language, setLanguage] = useState<Language | null>(null);
    const [variants, setVariants] = useState<LanguageVariant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadLanguage() {
            try {
                const languageData = await api<Language>(
                    `/languages/${id}`,
                );

                const variantData = await api<LanguageVariant[]>(
                    `/language-variants/language/${id}`,
                );

                setLanguage(languageData);
                setVariants(variantData);
            } catch (err) {
                console.error(err);

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load language.",
                );
            } finally {
                setLoading(false);
            }
        }

        loadLanguage();
    }, [id]);

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-zinc-50">
                <p className="text-sm text-zinc-500">
                    Loading language...
                </p>
            </main>
        );
    }

    if (error || !language) {
        return (
            <main className="min-h-screen bg-zinc-50 px-6 py-12">
                <div className="mx-auto max-w-4xl">
                    <button
                        onClick={() => router.back()}
                        className="mb-8 text-sm font-medium text-zinc-600 hover:text-zinc-900"
                    >
                        ← Back
                    </button>

                    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
                        {error || "Language not found."}
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-zinc-50 text-zinc-900">
            <header className="border-b border-zinc-200 bg-white">
                <div className="mx-auto flex h-16 max-w-7xl items-center px-6">
                    <button
                        onClick={() => router.back()}
                        className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
                    >
                        ← Back
                    </button>

                    <div className="ml-6 text-xl font-bold">
                        LingoLearn
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-6xl px-6 py-12">
                <section className="rounded-3xl border border-zinc-200 bg-white p-8">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-zinc-100 text-3xl font-bold">
                            {language.name.charAt(0).toUpperCase()}
                        </div>

                        <div>
                            <p className="text-sm font-medium uppercase tracking-wider text-zinc-400">
                                Language
                            </p>

                            <h1 className="mt-1 text-4xl font-bold">
                                {language.name}
                            </h1>

                            {language.nativeName && (
                                <p className="mt-1 text-zinc-500">
                                    {language.nativeName}
                                </p>
                            )}

                            {language.description && (
                                <p className="mt-4 max-w-2xl text-zinc-600">
                                    {language.description}
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                <section className="mt-12">
                    <h2 className="text-2xl font-bold">
                        Language Variants
                    </h2>

                    <p className="mt-2 text-zinc-500">
                        Choose the variant you want to learn.
                    </p>

                    {variants.length === 0 ? (
                        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-8 text-center">
                            <p className="font-medium">
                                No variants available yet.
                            </p>

                            <p className="mt-2 text-sm text-zinc-500">
                                Courses can be added once this language has
                                variants.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {variants.map((variant) => (
                                <button
                                    key={variant.id}
                                    onClick={() =>
                                        router.push(
                                            `/languages/${id}/variants/${variant.id}`,
                                        )
                                    }
                                    className="group rounded-2xl border border-zinc-200 bg-white p-6 text-left transition hover:-translate-y-1 hover:border-zinc-300 hover:shadow-lg"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 font-bold">
                                            {variant.name
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>

                                        <span className="text-zinc-400 transition group-hover:translate-x-1 group-hover:text-zinc-800">
                      →
                    </span>
                                    </div>

                                    <h3 className="mt-5 text-xl font-bold">
                                        {variant.name}
                                    </h3>

                                    {variant.code && (
                                        <p className="mt-1 text-sm text-zinc-500">
                                            {variant.code}
                                        </p>
                                    )}

                                    {variant.description && (
                                        <p className="mt-3 text-sm leading-6 text-zinc-500">
                                            {variant.description}
                                        </p>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}