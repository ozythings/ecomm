import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
    const {pathname} = req.nextUrl;
    const token = req.cookies.get("token")?.value;

    if (pathname.startsWith("/auth") && token) {
        const url = req.nextUrl.clone();

        url.pathname = "/";
        return NextResponse.redirect(url);
    } else NextResponse.next();

    if (!token) {
        const url = req.nextUrl.clone();

        url.pathname = "/auth/signin";
        return NextResponse.redirect(url);
    } else {
        const res = await fetch(process.env.api + "/auth/me", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                token,
            }
        });
        const json = await res.json();

        if (json.status !== 200) {
            sessionStorage.removeItem("token");

        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map)$).*)",
    ],
};
