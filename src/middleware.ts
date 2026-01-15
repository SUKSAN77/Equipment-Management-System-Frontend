import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getUser } from "@/lib/actions/users";
import { UserRole } from "@/types/users";

const authRoutes = ["/login", "/register", "/forgetpassword"];
const adminRoutes = ["/users", "/home", "/rooms", "/categories", "/equipment"];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const authCookie = request.cookies.get("auth");

    if (!authCookie && !authRoutes.includes(pathname)) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
        const user = await getUser();

        if (!user) {
            request.cookies.delete("auth");
        }

        if (user && authRoutes.includes(pathname)) {
            return NextResponse.redirect(new URL("/", request.url));
        }

        // manage user routes
        if (
            user &&
            ![
                UserRole.ADMIN,
                UserRole.DEPARTMENT_HEAD,
                UserRole.INVENTORY_MANAGER,
            ].includes(user.role) &&
            adminRoutes.includes(pathname)
        ) {
            return NextResponse.redirect(new URL("/", request.url));
        }
    } catch (error) {
        console.error("Error in middleware:", error);
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|auth).*)"],
};
