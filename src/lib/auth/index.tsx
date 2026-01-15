"use client";

import { createContext, ReactNode, useContext } from "react";

import type { UserMe } from "@/types/users";

type UserContextType = {
    userPromise: Promise<UserMe | null>;
};

const UserContext = createContext<UserContextType | null>(null);

export function useUser(): UserContextType {
    const context = useContext(UserContext);
    if (context === null) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
}

export function UserProvider({
    children,
    userPromise,
}: {
    children: ReactNode;
    userPromise: Promise<UserMe | null>;
}) {
    return (
        <UserContext.Provider value={{ userPromise }}>
            {children}
        </UserContext.Provider>
    );
}
