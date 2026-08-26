"use client";

import Link from "next/link";

interface LanguageCardProps {
    id: number;
    name: string;
    nativeName?: string | null;
    code?: string | null;
    description?: string | null;
}

export default function LanguageCard({
                                         id,
                                         name,
                                         nativeName,
                                         code,
                                         description,
                                     }: LanguageCardProps) {
    return (
        <Link
            href={`/languages/${id}`}
            className="group block rounded-3xl border border-zinc-200 bg-white p-6 transition hover:-translate-y-1 hover:border-zinc-300 hover:shadow-lg"
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 text-lg font-bold text-white">
                    {(
                        nativeName ||
                        name
                    ).charAt(0)}
                </div>

                <span className="text-zinc-400 transition group-hover:translate-x-1 group-hover:text-zinc-900">
                    →
                </span>
            </div>

            <h2 className="mt-6 text-xl font-bold text-zinc-900">
                {name}
            </h2>

            {nativeName &&
                nativeName !== name && (
                    <p className="mt-1 text-lg text-zinc-500">
                        {nativeName}
                    </p>
                )}

            {code && (
                <p className="mt-3 text-xs font-medium uppercase tracking-wider text-zinc-400">
                    {code}
                </p>
            )}

            {description && (
                <p className="mt-4 line-clamp-2 text-sm leading-6 text-zinc-500">
                    {description}
                </p>
            )}
        </Link>
    );
}