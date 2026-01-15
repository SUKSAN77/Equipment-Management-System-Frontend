import type { CreateClientConfig } from "@/client/client.gen";

export const createClientConfig: CreateClientConfig = (config) => ({
    ...config,
    baseUrl: "http://localhost:8000",
    credentials: "include",
    headers: {
        "Content-Type": "application/json",
    },
});
