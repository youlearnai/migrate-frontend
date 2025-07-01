import { GenUiFlashcardCardProps, GenUiFlashcardCardState } from "@/lib/types";
import React from "react";
import { useTranslation } from "react-i18next";
import { TooltipProvider } from "../ui/tooltip";
import { useSupports3D } from "./flashcard-card";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Lightbulb } from "lucide-react";
import Markdown from "../global/markdown";
import { convertStringToBbox, formatMilliseconds } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { useSourceStore } from "@/hooks/use-source-store";
import { isAudioType, isVideoType } from "@/lib/utils";

const GenUiFlashcardCard = React.forwardRef<
  HTMLDivElement,
  GenUiFlashcardCardProps
>((props, ref) => {
  const { t } = useTranslation();
  const { flashcard, cardState, setCardState } = props;
  const supports3D = useSupports3D();
  const { onSource } = useSourceStore();

  const toggleState = (key: keyof GenUiFlashcardCardState) => {
    setCardState({
      ...cardState,
      [key]: !cardState[key],
    });
  };

  const onFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleState("isFlipped");
  };

  const onToggleHint = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleState("showHint");
  };

  const onToggleExplanation = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleState("showExplanation");
  };

  const handleSource = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSource(
      flashcard.source,
      flashcard.bbox ? convertStringToBbox(flashcard.bbox) : undefined,
    );
  };

  return (
    <TooltipProvider>
      <div
        key="card-container"
        className={supports3D ? "perspective" : "relative w-full h-full"}
      >
        <Card
          key="flashcard"
          className={`w-full bg-background max-h-[calc(100vh-285px)] aspect-[4/3] cursor-pointer relative dark:bg-neutral-900/80 ${
            supports3D
              ? `transition-all duration-500 preserve-3d ${cardState.isFlipped ? "rotate-y-180" : ""}`
              : ""
          }`}
          onClick={onFlip}
        >
          <CardContent
            className={`absolute inset-0 flex flex-col h-full p-2 text-center ${
              supports3D
                ? "backface-hidden"
                : cardState.isFlipped
                  ? "hidden"
                  : "flex"
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                {flashcard.hint && (
                  <Button variant="ghost" size="sm" onClick={onToggleHint}>
                    <Lightbulb className="w-4 h-4 lg:w-3 lg:h-3 mr-1" />
                    <p className="text-sm font-normal hidden lg:block">
                      {t("flashcards.hint")}
                    </p>
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-grow flex flex-col items-center justify-center">
              <div className="lg:block hidden">
                <Markdown className={`px-0 lg:px-6 text-base lg:text-lg`}>
                  {flashcard.question}
                </Markdown>
                {cardState.showHint && flashcard.hint && (
                  <p className={`mt-4 mb-8 text-sm lg:text-base`}>
                    {t("flashcards.hint")}: {flashcard.hint}
                  </p>
                )}
              </div>
              <div className="lg:hidden block">
                {cardState.showHint && flashcard.hint ? (
                  <p className={`mt-4 mb-8 text-sm lg:text-base`}>
                    {t("flashcards.hint")}: {flashcard.hint}
                  </p>
                ) : (
                  <p className={`px-2 text-sm lg:text-base`}>
                    {flashcard.question}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
          <CardContent
            key="back-content"
            className={`absolute inset-0 flex flex-col h-full p-2 text-center ${
              supports3D
                ? "backface-hidden rotate-y-180"
                : cardState.isFlipped
                  ? "flex"
                  : "hidden"
            }`}
          >
            <div
              key="back-body"
              className="flex-grow flex flex-col items-center justify-center p-4"
            >
              {cardState.showAnswer && (
                <Markdown
                  key="back-answer"
                  className={`px-0 lg:px-6 text-sm lg:text-base`}
                >
                  {flashcard.answer}
                </Markdown>
              )}
              {cardState.showExplanation && flashcard.explanation && (
                <div className="flex flex-col space-y-4 mt-4 mx-auto w-full justify-center items-center">
                  <Markdown
                    key="back-explanation"
                    className={`text-sm lg:text-base`}
                  >
                    {flashcard.explanation}
                  </Markdown>
                  {flashcard.source && props.contentType && (
                    <Badge
                      variant="secondary"
                      className="cursor-pointer hover:bg-secondary/80 gap-1"
                      key="back-source"
                      onClick={handleSource}
                    >
                      <span>{t("flashcards.source")}</span>
                      <span>
                        {isVideoType(props.contentType) ||
                        isAudioType(props.contentType)
                          ? formatMilliseconds(flashcard.source)
                          : t("flashcards.page") + " " + flashcard.source}
                      </span>
                    </Badge>
                  )}
                </div>
              )}
              {flashcard.explanation && (
                <Button
                  key="back-toggle-explanation"
                  onClick={onToggleExplanation}
                  variant="ghost"
                  size="sm"
                  className="mt-0 lg:mt-4"
                >
                  {cardState.showExplanation
                    ? t("flashcards.hideExplanation")
                    : t("flashcards.showExplanation")}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
});

export default GenUiFlashcardCard;
