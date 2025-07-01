import TopLoader from "@/components/global/top-loader";
import PostHogPageView from "@/hooks/posthog-page-view";
import i18nConfig from "@/i18nConfig";
import initTranslations from "@/lib/i18n";
import BannerProvider from "@/providers/banner-provider";
import { CSPostHogProvider } from "@/providers/posthog-provider";
import ReactQueryProvider from "@/providers/react-query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import TranslationsProvider from "@/providers/translation-provider";
import { NextUIProvider } from "@nextui-org/system";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { NavigationGuardProvider } from "next-navigation-guard";
import { Geist } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import { Toaster } from "sonner";
import "@/app/[locale]/globals.css";
import CommandProvider from "@/providers/command-provider";
import ServerMaintenance from "@/components/global/server-maintenance";
import { SkewProtectionBuster } from "@/components/global/skew-buster";
import { YOULEARN_ASCII_ART } from "@/app/constants/ascii-art";
import Loading from "../loading";
import { getMarketingBaseUrl } from "@/lib/domains";

const IS_SERVER_MAINTENANCE = false;

export const metadata: Metadata = {
  title: {
    default:
      "YouLearn - An AI tutor made for you. Chat with your YouTube video, PDF, slides, websites, files and lectures.",
    template: "%s - Learn, Share, Collaborate.",
  },
  description:
    "Learn from an AI tutor that understands your pdfs, videos, and lectures.",
  metadataBase: new URL(getMarketingBaseUrl()),
  applicationName: "YouLearn AI",
  keywords: [
    "AI tutor",
    "education",
    "learning platform",
    "YouTube learning",
    "PDF learning",
    "Recording lectures",
    "online education",
    "personalized learning",
    "AI education",
    "video learning",
  ],
  authors: [{ name: "YouLearn AI" }],
  creator: "YouLearn AI",
  publisher: "YouLearn AI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: getMarketingBaseUrl(),
    languages: Object.fromEntries(
      i18nConfig.locales.map((locale) => [
        locale,
        `${getMarketingBaseUrl()}/${locale}`,
      ]),
    ),
  },
  category: "education",
  openGraph: {
    type: "website",
    siteName: "YouLearn AI",
    title: "YouLearn - Your Personal AI Tutor",
    description:
      "Learn from an AI tutor that understands your pdfs, videos, and lectures.",
    url: getMarketingBaseUrl(),
    locale: "en_US",
    images: [
      {
        url: "/en/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "YouLearn - AI Powered Learning",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "YouLearn - Your Personal AI Tutor",
    description:
      "Learn from an AI tutor that understands your pdfs, videos, and lectures.",
    images: ["/opengraph-image.png"],
    creator: "@youlearn",
    site: "@youlearn",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      {
        media: "(prefers-color-scheme: light)",
        url: "/youlearn.png",
        href: "/youlearn.png",
      },
      {
        media: "(prefers-color-scheme: dark)",
        url: "/youlearn-dark.png",
        href: "/youlearn-dark.png",
      },
    ],
  },
};

const i18nNamespaces = ["default"];

const geistSans = Geist({ subsets: ["latin"] });

export default async function RootLayout(
  props: Readonly<{
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
  }>,
) {
  const params = await props.params;

  const { children } = props;

  const { t, resources } = await initTranslations(
    params.locale,
    i18nNamespaces,
  );

  if (IS_SERVER_MAINTENANCE) {
    return (
      <html
        lang={params.locale}
        suppressHydrationWarning
        className="bg-background"
      >
        <body
          className={`${geistSans.className} selection:bg-[#7DFF97]/100 selection:text-neutral-900/100 bg-background md:min-h-screen`}
        >
          <TranslationsProvider
            namespaces={i18nNamespaces}
            locale={params.locale}
            resources={resources}
          >
            <Toaster duration={3000} />
            <ServerMaintenance />
          </TranslationsProvider>
        </body>
      </html>
    );
  }
  return (
    <html
      lang={params.locale}
      suppressHydrationWarning
      className="bg-background notranslate"
      translate="no"
    >
      <head>
        <meta name="googlebot" content="notranslate" />
        <meta name="google" content="notranslate" />
        <Script
          id="polyfill-promise-with-resolvers"
          strategy="beforeInteractive"
        >
          {`
            if (typeof Promise.withResolvers !== 'function') {
              Promise.withResolvers = function () {
                let resolveFn;
                let rejectFn;
                const promise = new Promise((resolve, reject) => {
                  resolveFn = resolve;
                  rejectFn = reject;
                });
                // The executor runs synchronously, so the functions are defined immediately.
                return { promise, resolve: resolveFn, reject: rejectFn };
              };
            }
          `}
        </Script>
      </head>
      <CSPostHogProvider>
        <body
          className={`${geistSans.className} selection:bg-[#7DFF97]/100 selection:text-neutral-900/100 bg-background md:min-h-screen`}
        >
          <NextUIProvider>
            <TranslationsProvider
              namespaces={i18nNamespaces}
              locale={params.locale}
              resources={resources}
            >
              <ReactQueryProvider>
                <ThemeProvider
                  defaultTheme="dark"
                  attribute="class"
                  disableTransitionOnChange
                >
                  <Script
                    src="https://r.wdfl.co/rw.js"
                    data-rewardful="0eed1f"
                  ></Script>
                  <Script id="rewardful-queue" strategy="beforeInteractive">
                    {`(function(w,r){w._rwq=r;w[r]=w[r]||function(){(w[r].q=w[r].q||[]).push(arguments)}})(window,'rewardful');`}
                  </Script>
                  <Script id="we-are-hiring" strategy="afterInteractive">
                    {`
                    console.log(${JSON.stringify(YOULEARN_ASCII_ART)} + "%c We're hiring! Join our team at ${getMarketingBaseUrl()}/careers", "color: #3CB371; font-size: 11px;");
                    `}
                  </Script>
                  <NavigationGuardProvider>
                    <CommandProvider />
                    <Toaster />
                    <SkewProtectionBuster />
                    <Suspense fallback={<Loading />}>
                      <PostHogPageView />
                    </Suspense>
                    <TopLoader />
                    <BannerProvider />
                    <main className="flex-grow px-6">
                      <SpeedInsights sampleRate={0.05} />
                      {children}
                    </main>
                  </NavigationGuardProvider>
                </ThemeProvider>
                {process.env.NODE_ENV === "development" && (
                  <>
                    {process.env.REACT_QUERY_DEV_TOOL === "true" && (
                      <ReactQueryDevtools initialIsOpen={false} />
                    )}
                  </>
                )}
              </ReactQueryProvider>
            </TranslationsProvider>
          </NextUIProvider>
        </body>
      </CSPostHogProvider>
    </html>
  );
}
