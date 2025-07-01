"use client";

import Link from "next/link";
import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslation } from "react-i18next";

const FAQ = () => {
  const { t } = useTranslation();

  const faqData = [
    {
      title: t("affiliate.faq.joining.title"),
      content: t("affiliate.faq.joining.content"),
      subtitle: <h3>{t("affiliate.faq.joining.subtitle")}</h3>,
    },
    {
      title: t("affiliate.faq.commission.title"),
      content: t("affiliate.faq.commission.content"),
      subtitle: <h3>{t("affiliate.faq.commission.subtitle")}</h3>,
    },
    {
      title: t("affiliate.faq.tracking.title"),
      content: t("affiliate.faq.tracking.content"),
      subtitle: <h3>{t("affiliate.faq.tracking.subtitle")}</h3>,
    },
    {
      title: t("affiliate.faq.payments.title"),
      content: t("affiliate.faq.payments.content"),
      subtitle: <h3>{t("affiliate.faq.payments.subtitle")}</h3>,
    },
    {
      title: t("affiliate.faq.promotion.title"),
      content: t("affiliate.faq.promotion.content"),
      subtitle: <h3>{t("affiliate.faq.promotion.subtitle")}</h3>,
    },
    {
      title: t("affiliate.faq.support.title"),
      content: t("affiliate.faq.support.content"),
      subtitle: <h3>{t("affiliate.faq.support.subtitle")}</h3>,
    },
  ];

  return (
    <div className="flex flex-col mb-12">
      <h1 className="text-2xl font-semibold text-center">
        {t("affiliate.faq.mainTitle")}
      </h1>
      <span className="mt-6 lg:mb-12 mb-10 text-center">
        {t("affiliate.faq.cantFindAnswer")} &nbsp;
        <Link href="/contact" className="underline">
          {t("affiliate.faq.contactUs")}
        </Link>
      </span>
      <div className="px-4 container max-w-[900px] mx-auto">
        <Accordion type="single" collapsible>
          {faqData.map((item, index) => (
            <AccordionItem
              className="leading-loose font-normal opacity-90 -mt-2 mb-3"
              key={index}
              value={`item-${index}`}
            >
              <AccordionTrigger className="text-lg">
                {item.title}
              </AccordionTrigger>
              <AccordionContent className="text-base text-primary/70">
                {item.content}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};

export default FAQ;
