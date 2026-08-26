"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";

export default function LogoutButton() {
    const router = useRouter();

    const [loading, setLoading] =
        useState(false);

    async function logout() {
        try {
            setLoading(true);

            await api("/auth/logout", {
                method: "POST",
            });
        } catch (error) {
            console.error(
                "Logout failed:",
                error,
            );
        } finally {
            router.replace("/login");
            router.refresh();
        }
    }

    return (
        <button
            type="button"
            onClick={logout}
            disabled={loading}
            className="text-sm font-medium text-zinc-500 transition hover:text-red-600 disabled:opacity-50"
        >
            {loading
                ? "Logging out..."
                : "Logout"}
        </button>
    );
}