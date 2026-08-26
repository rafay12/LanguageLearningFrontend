import { api } from "./api";

export interface User {
    id: number;
    email: string;
    username: string;
    name: string;
}

interface LoginResponse {
    accessToken: string;
}

interface RegisterResponse {
    accessToken: string;
}

const TOKEN_KEY = "lingolearn_token";

export function getToken(): string | null {
    if (typeof window === "undefined") {
        return null;
    }

    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
}

export async function login(
    email: string,
    password: string,
): Promise<User> {
    const result = await api<LoginResponse>(
        "/auth/login",
        {
            method: "POST",
            body: JSON.stringify({
                email,
                password,
            }),
        },
    );

    setToken(result.accessToken);

    return getCurrentUser();
}

export async function register(
    email: string,
    password: string,
    username: string,
    name: string,
): Promise<User> {
    const result = await api<RegisterResponse>(
        "/auth/register",
        {
            method: "POST",
            body: JSON.stringify({
                email,
                password,
                username,
                name,
            }),
        },
    );

    setToken(result.accessToken);

    return getCurrentUser();
}

export async function getCurrentUser(): Promise<User> {
    const token = getToken();

    if (!token) {
        throw new Error("Not authenticated");
    }

    return api<User>("/auth/me", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

export function logout(): void {
    removeToken();
}