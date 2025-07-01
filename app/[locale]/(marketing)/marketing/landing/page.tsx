import initTranslations from "@/lib/i18n";
import { Metadata } from "next";
import { getAppBaseUrl } from "@/lib/domains";
import { getMarketingBaseUrl } from "@/lib/domains";

export const metadata: Metadata = {
  title: "YouLearn – Your AI Tutor",
  description:
    "Learn smarter with an AI tutor that understands your videos, PDFs and lectures.",
  metadataBase: new URL(getMarketingBaseUrl()),
};

const namespaces = ["default"];

export default async function MarketingLanding(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const { t } = await initTranslations(params.locale, namespaces);

  const appBaseUrl = getAppBaseUrl();

  return (
    <section className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <h1 className="text-center text-4xl md:text-6xl font-bold mb-6">
        {t("landing.title", { defaultValue: "Learn anything. Instantly." })}
      </h1>
      <p className="max-w-xl text-center text-lg text-muted-foreground mb-10">
        {t("landing.tagline", {
          defaultValue:
            "Chat with your documents, videos and lectures. Master any concept 10× faster.",
        })}
      </p>
      <a
        href={`${appBaseUrl}/signin`}
        className="py-3 px-6 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
      >
        {t("landing.getStarted", { defaultValue: "Get started – it's free" })}
      </a>
    </section>
  );
}
