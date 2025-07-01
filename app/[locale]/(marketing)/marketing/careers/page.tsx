import { Metadata } from "next";
import initTranslations from "@/lib/i18n";
import { getMarketingBaseUrl } from "@/lib/domains";

export const metadata: Metadata = {
  title: "Careers – YouLearn",
  description:
    "Join our team and help build the future of AI-powered learning.",
  metadataBase: new URL(getMarketingBaseUrl()),
};

const namespaces = ["default"];

export default async function MarketingCareers(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const { locale } = params;
  const { t } = await initTranslations(locale, namespaces);

  return (
    <section className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <h1 className="text-center text-4xl md:text-6xl font-bold mb-6">
        {t("careers.title", { defaultValue: "Join Our Team" })}
      </h1>
      <p className="max-w-xl text-center text-lg text-muted-foreground mb-10">
        {t("careers.description", {
          defaultValue:
            "Help us build the future of AI-powered learning. We're always looking for talented individuals to join our mission.",
        })}
      </p>
      <div className="text-center">
        <p className="text-muted-foreground">
          {t("careers.comingSoon", {
            defaultValue: "Job openings coming soon!",
          })}
        </p>
      </div>
    </section>
  );
}
