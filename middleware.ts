import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { i18nRouter } from "next-i18n-router";
import i18nConfig from "./i18nConfig";
import { isMarketingHost } from "@/lib/domains";

const ALLOWED_DOMAINS = [
  "/signin",
  "/signup",
  "/verify",
  "/reset-password",
  "/api",
  "/static",
  "/_next",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/add",
  "/learn",
  "/space",
  "/pricing",
  "/contact",
  "/discord",
  "/affiliate",
];

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();

  // Handle /add/ URL rewriting
  if (url?.pathname?.startsWith("/add/")) {
    let fullPath = url.pathname.slice(5) + url.search;

    if (!fullPath?.startsWith("http")) {
      fullPath = "https://" + fullPath;
    }

    if (fullPath?.startsWith("https:/") && !fullPath?.startsWith("https://")) {
      fullPath = fullPath.replace("https:/", "https://");
    }

    if (fullPath?.startsWith("http:/") && !fullPath?.startsWith("http://")) {
      fullPath = fullPath.replace("http:/", "http://");
    }

    const lang =
      request.cookies.get("NEXT_LOCALE")?.value || i18nConfig.defaultLocale;

    const rewriteUrl = new URL(
      `/${lang}/add/${encodeURIComponent(fullPath)}`,
      request.url,
    );
    return NextResponse.rewrite(rewriteUrl);
  }

  // Host-based routing: serve marketing tenant for apex domain (youlearn.ai)
  const host = request.headers.get("host");

  if (isMarketingHost(host)) {
    // For marketing domain, rewrite to marketing tenant with locale
    const lang =
      request.cookies.get("NEXT_LOCALE")?.value || i18nConfig.defaultLocale;

    const rewriteUrl = new URL(
      `/${lang}/marketing${url.pathname}`,
      request.url,
    );
    rewriteUrl.search = url.search;

    return NextResponse.rewrite(rewriteUrl);
  }

  return i18nRouter(request, i18nConfig);
}

export const config = {
  matcher: ["/add/:path*", "/((?!api|static|.*\\..*|_next).*)"],
};
