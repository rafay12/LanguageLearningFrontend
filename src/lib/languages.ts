import { api } from "./api";

export interface Language {
    id: number;
    name: string;
    code: string;
}

export async function getLanguages(): Promise<Language[]> {
    return api<Language[]>("/languages");
}