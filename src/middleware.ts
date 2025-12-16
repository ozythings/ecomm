import {NextRequest, NextResponse} from "next/server";

const not_authenticated = ["/auth"];

export function middleware(req: NextRequest, res: NextResponse) {
    const {pathname} = req.nextUrl;
    const req_auth = not_authenticated.some((p) => pathname.startsWith(p));
    const token = req.cookies.get("token")?.value

    if (!req_auth) return NextResponse.next();
    if (token) {
        const url = req.nextUrl.clone();
        url.pathname = "/";
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/auth/:path*"],
};
