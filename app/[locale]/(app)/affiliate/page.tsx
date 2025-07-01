import FAQ from "@/components/affiliate/faq";
import { Button } from "@/components/ui/button";
import initTranslations from "@/lib/i18n";
import Link from "next/link";
import React from "react";

const Affiliate = async (props: { params: Promise<{ locale: string }> }) => {
  const params = await props.params;
  const { t } = await initTranslations(params.locale, ["default"]);

  return (
    <div className="flex mt-10 w-full text-center items-center px-10 justify-center flex-col">
      <h1 className="text-3xl font-semibold text-center">
        {t("affiliate.earnCommission", { commission: "30%" })}
      </h1>
      <h2 className="mt-5 text-primary/50">{t("affiliate.becomeAffiliate")}</h2>
      <div className="flex flex-row space-x-2 mt-6">
        <Link
          href="https://youlearn-ai.getrewardful.com/signup"
          target="_blank"
        >
          <Button>{t("affiliate.joinProgram")}</Button>
        </Link>
        <Link href="https://youlearn-ai.getrewardful.com/" target="_blank">
          <Button variant="secondary">{t("affiliate.viewDashboard")}</Button>
        </Link>
      </div>
      <div className="mt-14 w-full">
        <FAQ />
      </div>
    </div>
  );
};

export default Affiliate;
