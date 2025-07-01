import { Metadata } from "next";
import { getMarketingBaseUrl } from "@/lib/domains";

export const metadata: Metadata = {
    title: "Test – YouLearn",
    description: "Test page for marketing routing",
    metadataBase: new URL(getMarketingBaseUrl()),
};

export default function TestPage() {
    return (
        <section className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
            <h1 className="text-center text-4xl md:text-6xl font-bold mb-6">
                Marketing Route Test
            </h1>
            <p className="max-w-xl text-center text-lg text-muted-foreground mb-10">
                If you can see this page at youlearn.ai/test, the routing is working perfectly!
            </p>
            <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                    File: app/[locale]/(marketing)/marketing/test/page.tsx
                </p>
                <p className="text-sm text-muted-foreground">
                    URL: youlearn.ai/test → /en/marketing/test
                </p>
            </div>
        </section>
    );
} 