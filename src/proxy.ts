import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.ACCESS_TOKEN_KEY
    ? new TextEncoder().encode(process.env.ACCESS_TOKEN_KEY)
    : null;

async function verifyToken(token: string) {
    if (!JWT_SECRET) return null;

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload;
    } catch {
        return null;
    }
}

export async function proxy(request: NextRequest) {
    const { pathname, search } = request.nextUrl;

    // Allow the community login page without authentication.
    if (
        pathname === "/community/login" ||
        pathname.startsWith("/community/login/")
    ) {
        return NextResponse.next();
    }

    // Protect community routes.
    const isCommunityRoute =
        pathname === "/community" ||
        pathname.startsWith("/community/");

    if (!isCommunityRoute) {
        return NextResponse.next();
    }

    const token = request.cookies.get("auth")?.value;
    const payload = token ? await verifyToken(token) : null;

    if (!payload) {
        const loginUrl = new URL("/community/login", request.url);

        loginUrl.searchParams.set(
            "callbackUrl",
            `${pathname}${search}`
        );

        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/community/:path*"],
};