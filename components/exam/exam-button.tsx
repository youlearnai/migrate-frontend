import React, { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { BookCheck } from "lucide-react";
import useSpaceExamStore from "@/hooks/use-space-exam-store";
import { useTranslation } from "react-i18next";
import { useSearchParams, useParams } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGetSpace } from "@/query-hooks/space";

const ExamButton = () => {
  const { isSpaceExamOpen, setIsSpaceExamOpen, reset } = useSpaceExamStore();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const shouldHighlight = searchParams.get("highlight") === "exam";
  const [showTooltip, setShowTooltip] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const params = useParams();
  const spaceId = params.spaceId as string;
  const { data: spaceData } = useGetSpace(spaceId);
  const hasContents = spaceData?.contents && spaceData.contents.length > 0;
  const [showNoContentTooltip, setShowNoContentTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shouldHighlight) {
      setShowTooltip(true);
      setIsFading(false);
    }
  }, [shouldHighlight]);

  useEffect(() => {
    if (showNoContentTooltip) {
      const timer = setTimeout(() => {
        setShowNoContentTooltip(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showNoContentTooltip]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        showTooltip &&
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node)
      ) {
        handleCloseTooltip();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showTooltip]);

  const handleOpenExam = () => {
    if (isSpaceExamOpen) {
      setIsSpaceExamOpen(false);
    } else {
      reset();
      setIsSpaceExamOpen(true);
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    if (!hasContents) {
      e.preventDefault();
      e.stopPropagation();
      setShowNoContentTooltip(true);
    } else {
      handleOpenExam();
    }
  };

  const handleCloseTooltip = () => {
    setIsFading(true);
    setTimeout(() => {
      setShowTooltip(false);
      setIsFading(false);
    }, 500);
  };

  const NoContentButton = (
    <TooltipProvider>
      <Tooltip open={showNoContentTooltip}>
        <TooltipTrigger asChild>
          <Button
            className="flex items-center justify-center gap-2 w-full opacity-70 cursor-not-allowed"
            onClick={handleButtonClick}
            variant="default"
          >
            <BookCheck className="w-4 h-4" />
            <span>{t("createExam")}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-[250px] p-3">
          {t("exam.addContentFirstRegular", {
            defaultValue:
              "Add content to your space first before creating an exam",
          })}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const RegularButton = (
    <Button
      className="flex items-center justify-center gap-2 w-full"
      onClick={handleOpenExam}
      variant={isSpaceExamOpen ? "secondary" : "default"}
      aria-pressed={isSpaceExamOpen}
    >
      <BookCheck className="w-4 h-4" />
      <span>{isSpaceExamOpen ? t("closeExam") : t("createExam")}</span>
    </Button>
  );

  const ButtonComponent = (
    <div className={`relative ${shouldHighlight ? "p-[1px] " : "p-0"}`}>
      {hasContents ? RegularButton : NoContentButton}
    </div>
  );

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip open={showTooltip}>
          <TooltipTrigger asChild>{ButtonComponent}</TooltipTrigger>
          <TooltipContent
            ref={tooltipRef}
            className={`max-w-[300px] p-4 transition-opacity duration-500 leading-relaxed ${isFading ? "opacity-0" : "opacity-100"}`}
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                {t("testYourKnowledge", {
                  defaultValue: "Test Your Knowledge",
                })}
              </h4>
              <button
                onClick={handleCloseTooltip}
                className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
                aria-label="Close tooltip"
              >
                ✕
              </button>
            </div>
            {hasContents ? (
              <p>{t("exam.clickToCreateExam")}</p>
            ) : (
              <p>
                {t("exam.addContentFirst", {
                  defaultValue:
                    "Add content to your space first before creating an exam",
                })}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return ButtonComponent;
};

export default ExamButton;
