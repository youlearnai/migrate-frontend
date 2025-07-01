"use client";
import React from "react";
import { useTranslation } from "react-i18next";

const MagicHeading = () => {
  const { t } = useTranslation();

  return (
    <h2 className="text-center font-normal sm:text-3xl 2xl:text-4xl text-xl mb-3">
      {t("layout.learnToday")}
    </h2>
  );
};

export default MagicHeading;
