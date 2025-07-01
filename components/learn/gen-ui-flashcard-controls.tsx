import React from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "../ui/tooltip";
import { Button } from "../ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Shuffle,
  WalletCards,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { GenUiFlashcardControlsProps } from "@/lib/types";

const GenUiFlashcardControls = ({
  onPrev,
  onNext,
  canGoPrev,
  isLastCard,
  onFinish,
  currentIndex,
  totalCards,
}: GenUiFlashcardControlsProps) => {
  const { t } = useTranslation();
  return (
    <TooltipProvider>
      <div className="mt-6 flex flex-col space-y-6">
        <div className="relative flex items-center justify-center w-full">
          <div className="absolute left-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={onPrev}
                    disabled={!canGoPrev}
                    className="h-10 w-10"
                    aria-label="Previous card"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("flashcards.previousCard")}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="text-center text-sm flex-shrink-0 text-muted-foreground">
            {currentIndex + 1} / {totalCards}
          </div>

          <div className="absolute right-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  {isLastCard ? (
                    <Button
                      variant="outline"
                      onClick={onFinish}
                      className="h-10 w-10 p-0"
                    >
                      <ArrowRight className="h-4 w-4" />
                      <span className="sr-only">Next slide</span>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={onNext}
                      className="h-10 w-10"
                      aria-label="Next card"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {isLastCard
                    ? t("flashcards.finish")
                    : t("flashcards.nextCard")}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default GenUiFlashcardControls;
