"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import {
    AuthUser,
    getCurrentUser,
} from "@/lib/auth";

interface AuthContextValue {
    user: AuthUser | null;
    loading: boolean;
    refreshUser: () => Promise<void>;
}

const AuthContext =
    createContext<AuthContextValue | null>(
        null,
    );

export function AuthProvider({
                                 children,
                             }: {
    children: React.ReactNode;
}) {
    const [user, setUser] =
        useState<AuthUser | null>(null);

    const [loading, setLoading] =
        useState(true);

    async function refreshUser() {
        const currentUser =
            await getCurrentUser();

        setUser(currentUser);
    }

    useEffect(() => {
        refreshUser().finally(() =>
            setLoading(false),
        );
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context =
        useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used inside AuthProvider",
        );
    }

    return context;
}