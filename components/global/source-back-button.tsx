import React from "react";
import { useSourceStore } from "@/hooks/use-source-store";
import { ArrowLeftIcon } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "../ui/button";
import { useTranslation } from "react-i18next";
const SourceBackButton = () => {
  const router = useRouter();
  const params = useParams();
  const { sourceOrigin } = useSourceStore();
  const { t } = useTranslation();
  const handleBackClick = () => {
    if (sourceOrigin?.type === "exam") {
      router.push(`/exam/${sourceOrigin.origin}/space/${params.spaceId}`);
    }
    if (sourceOrigin?.type === "examProgress") {
      router.push(
        `/exam/${sourceOrigin.origin}/space/${params.spaceId}/progress`,
      );
    }
  };

  if (sourceOrigin?.type === "exam" || sourceOrigin?.type === "examProgress") {
    return (
      <Button
        className="flex items-center px-3 gap-2 sm:gap-2"
        variant="outline"
        onClick={handleBackClick}
      >
        <ArrowLeftIcon className="w-4 h-4" />
        <span className="hidden sm:inline">{t("exam.goBack")}</span>
      </Button>
    );
  }

  return null;
};

export default SourceBackButton;
