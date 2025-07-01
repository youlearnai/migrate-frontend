import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import initTranslations from "@/lib/i18n";
import { REFUND_PERIOD_DAYS, STUDENT_DISCOUNT_PERCENTAGE } from "@/lib/utils";
import Link from "next/link";

const FAQ = async ({ locale }: { locale: string }) => {
  const { t } = await initTranslations(locale, ["default"]);

  const faqQuestions = [
    // {
    //   key: "question1",
    //   variables: {
    //     FREE_PLAN_MESSAGES,
    //     FREE_PLAN_CONTENTS,
    //     PROYEARLYPRICE,
    //     PRO_PLAN_PDF_SIZE_LIMIT_MB,
    //   },
    // },
    { key: "question4", variables: { STUDENT_DISCOUNT_PERCENTAGE } },
    { key: "question2" },
    { key: "question3" },
    { key: "question5", variables: { STUDENT_DISCOUNT_PERCENTAGE } },
    { key: "question6", variables: { REFUND_PERIOD_DAYS } },
  ];

  return (
    <div className="flex flex-col py-12">
      <h1 className="text-2xl font-normal text-center lg:block hidden">
        {t("faq.heading.desktop")}
      </h1>
      <h1 className="text-2xl font-normal text-center lg:hidden block">
        {t("faq.heading.mobile")}
      </h1>
      <span className="mt-4 lg:mb-12 mb-10 text-center text-neutral-500 dark:text-neutral-400">
        {t("faq.noAnswer")} &nbsp;
        <Link href="/contact" className="underline">
          {t("faq.contactLink")}
        </Link>
      </span>
      <div className="px-4 container max-w-[900px] mx-auto">
        <Accordion type="single" collapsible>
          {faqQuestions.map((question, index) => (
            <AccordionItem
              key={question.key}
              className="leading-loose font-normal opacity-90 -mt-2 mb-3"
              value={`item-${index}`}
            >
              <AccordionTrigger className="text-lg font-normal">
                {t(`faq.${question.key}.title`)}
              </AccordionTrigger>
              <AccordionContent className="text-base text-primary/70">
                <h3>{t(`faq.${question.key}.subtitle`)}</h3>
                <span>
                  {t(`faq.${question.key}.content`, question.variables)}
                </span>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};

export default FAQ;
