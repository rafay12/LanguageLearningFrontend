"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/AuthProvider";

export default function ProtectedRoute({
                                           children,
                                       }: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    const {
        user,
        loading,
    } = useAuth();

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/login");
        }
    }, [
        loading,
        user,
        router,
    ]);

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-zinc-50">
                <div className="text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />

                    <p className="mt-4 text-sm text-zinc-500">
                        Loading...
                    </p>
                </div>
            </main>
        );
    }

    if (!user) {
        return null;
    }

    return <>{children}</>;
}