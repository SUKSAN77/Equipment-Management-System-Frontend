"use server";

import { cookies } from "next/headers";

import { UsersService } from "@/client";
import type { UserMe } from "@/types/users";

export async function getUser(): Promise<UserMe> {
    const cookieStore = await cookies();
    const { data } = await UsersService.getApiV1UsersMe({
        headers: {
            cookie: cookieStore.toString(),
        },
    });
    return data as UserMe;
}
