import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
    const {pathname} = req.nextUrl;
    const token = req.cookies.get("token")?.value;

    if (pathname.startsWith("/auth")) {
        if (token) {
            const url = req.nextUrl.clone();

            url.pathname = "/";
            return NextResponse.redirect(url);
        }

        return NextResponse.next();
    }

    if (!token) {
        const url = req.nextUrl.clone();

        url.pathname = "/auth/signin";
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map)$).*)",
    ],
};
