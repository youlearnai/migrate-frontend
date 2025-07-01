"use client";

import { useTranslation } from "react-i18next";
import UserSpaces from "./user-spaces";
import useAuth from "@/hooks/use-auth";

const Spaces = () => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();

  if (!user || loading) {
    return null;
  }

  return (
    <div className="w-full mb-10">
      <div className="text-left w-full flex justify-between items-center text-base lg:text-lg">
        <span className="items-end">{t("spaces.mySpaces")}</span>
      </div>
      <div className="mt-4">
        <UserSpaces />
      </div>
    </div>
  );
};

export default Spaces;
