import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useAuth from "@/hooks/use-auth";
import { hasChanges, useFlashcardStore } from "@/hooks/use-flashcard-store";
import { useResizeStore } from "@/hooks/use-resize-store";
import { Flashcard, FlashcardCardProps } from "@/lib/types";
import { convertStringToBbox, formatMilliseconds } from "@/lib/utils";
import {
  flashcardsARawKey,
  flashcardsRawKey,
  useUpdateFlashcards,
} from "@/query-hooks/content";
import { Lightbulb, Pencil, Star } from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { memo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import Markdown from "../global/markdown";
import { useQueryClient } from "@tanstack/react-query";

// TODO: Remove this once we have a better way to check if 3D is supported
export const useSupports3D = () => {
  const [supports3D, setSupports3D] = useState(true);

  useEffect(() => {
    const el = document.createElement("div");
    const supports3D =
      window.getComputedStyle(el).getPropertyValue("transform-style") !==
      undefined;
    setSupports3D(supports3D);
  }, []);

  return supports3D;
};

export const FlashcardCard = memo(
  function FlashcardCard({
    flashcard,
    isFlipped,
    showHint,
    showExplanation,
    showAnswer,
    onFlip,
    onToggleHint,
    onToggleExplanation,
    onSource,
  }: FlashcardCardProps) {
    const { mode } = useFlashcardStore();
    if (!flashcard) {
      return null;
    }

    const params = useParams();
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useAuth();
    const { setView, displayModifiers } = useFlashcardStore();
    const { t } = useTranslation();
    const { mutate: updateFlashcards } = useUpdateFlashcards();
    const supports3D = useSupports3D();
    const { isFullTab } = useResizeStore();
    const queryClient = useQueryClient();

    const toggleStar = () => {
      if (user) {
        // optimistic update for flashcardsRaw
        queryClient.setQueryData(
          flashcardsRawKey(user.uid, params.contentId as string),
          (old: Flashcard[]) => {
            return old.map((flashcard: Flashcard) => ({
              ...flashcard,
              is_starred:
                flashcard._id === flashcard._id
                  ? !flashcard.is_starred
                  : flashcard.is_starred,
            }));
          },
        );

        // optimistic update for flashcardsARaw
        queryClient.setQueryData(
          flashcardsARawKey(user.uid, params.contentId as string),
          (old: Flashcard[]) => {
            return old.map((flashcard: Flashcard) => ({
              ...flashcard,
              is_starred:
                flashcard._id === flashcard._id
                  ? !flashcard.is_starred
                  : flashcard.is_starred,
            }));
          },
        );

        updateFlashcards({
          contentId: params.contentId as string,
          flashcards: [
            { id: flashcard._id, is_starred: !flashcard.is_starred },
          ],
        });
      } else {
        toast.error(t("flashcards.signInToAccess"));
        router.push(`/signin?returnUrl=${encodeURIComponent(pathname)}`);
      }
    };

    const ActionButtons = () => (
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              size="sm"
              pressed={flashcard.is_starred}
              onPressedChange={toggleStar}
              onClick={(e) => e.stopPropagation()}
            >
              <Star
                className={`w-4 h-4 ${flashcard.is_starred ? "fill-yellow-400 text-yellow-400" : ""}`}
              />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>
              {t(
                "flashcards.starActions." +
                  (flashcard.is_starred ? "remove" : "add"),
              )}
            </p>
          </TooltipContent>
        </Tooltip>
        {mode === "fastReview" && (
          <div className="relative">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (user) {
                      setView("manage", {
                        contentId: params.contentId as string,
                        flashcardId: flashcard._id,
                      });
                    } else {
                      router.push(
                        `/signin?returnUrl=${encodeURIComponent(pathname)}`,
                      );
                      toast.error(t("flashcards.signInToAccess"));
                      return;
                    }
                  }}
                  className="relative"
                >
                  <Pencil className="w-4 h-4" />
                  {hasChanges() && (
                    <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-yellow-600 dark:bg-yellow-500 rounded-full" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>
                  {hasChanges()
                    ? t("flashcards.editUnsaved")
                    : t("flashcards.edit")}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    );

    if (!flashcard.isVisible) {
      return (
        <Card
          key="invisible-card"
          className="w-full bg-background max-h-[calc(100vh-285px)] aspect-[4/3]"
        >
          <CardContent
            key="invisible-content"
            className="flex items-center justify-center h-full"
          >
            <div key="invisible-placeholder" className="w-full h-full" />
          </CardContent>
        </Card>
      );
    }

    return (
      <TooltipProvider>
        <div
          key="card-container"
          className={supports3D ? "perspective" : "relative w-full h-full"}
        >
          <Card
            key="flashcard"
            className={`w-full bg-background max-h-[calc(100vh-285px)] aspect-[4/3] cursor-pointer relative ${
              supports3D
                ? `transition-all duration-500 preserve-3d ${isFlipped ? "rotate-y-180" : ""}`
                : ""
            }`}
            onClick={onFlip}
          >
            <CardContent
              className={`absolute inset-0 flex flex-col h-full p-2 text-center ${
                supports3D ? "backface-hidden" : isFlipped ? "hidden" : "flex"
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
                <ActionButtons />
              </div>

              <div className="flex-grow flex flex-col items-center justify-center">
                <div className="lg:block hidden">
                  <Markdown
                    className={`px-0 lg:px-6 ${isFullTab ? "text-xl" : "text-base lg:text-lg"}`}
                  >
                    {flashcard.question}
                  </Markdown>
                  {showHint && flashcard.hint && (
                    <p
                      className={`mt-4 mb-8 ${isFullTab ? "text-lg" : "text-sm lg:text-base"}`}
                    >
                      {t("flashcards.hint")}: {flashcard.hint}
                    </p>
                  )}
                </div>
                <div className="lg:hidden block">
                  {showHint && flashcard.hint ? (
                    <p
                      className={`mt-4 mb-8 ${isFullTab ? "text-lg" : "text-sm lg:text-base"}`}
                    >
                      {t("flashcards.hint")}: {flashcard.hint}
                    </p>
                  ) : (
                    <Markdown
                      className={`px-2 ${isFullTab ? "text-lg" : "text-base lg:text-lg"}`}
                    >
                      {flashcard.question}
                    </Markdown>
                  )}
                </div>
              </div>

              <div key="front-footer" className="mt-auto">
                {displayModifiers.isShuffled && (
                  <div className="flex justify-end">
                    <div className="flex items-center gap-1 bg-primary/50 backdrop-blur-sm text-primary-foreground px-2 py-1 rounded-sm text-xs font-medium">
                      <span>{t("flashcards.shuffleOn")}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardContent
              key="back-content"
              className={`absolute inset-0 flex flex-col h-full p-2 text-center ${
                supports3D
                  ? "backface-hidden rotate-y-180"
                  : isFlipped
                    ? "flex"
                    : "hidden"
              }`}
            >
              <div
                key="back-header"
                className="flex justify-between items-start"
              >
                <div key="back-spacer" />
                <div
                  key="back-actions"
                  className={supports3D ? "rotate-y-180 transform-gpu" : ""}
                >
                  <ActionButtons key="back-action-buttons" />
                </div>
              </div>
              <div
                key="back-body"
                className="flex-grow flex flex-col items-center justify-center p-4"
              >
                {showAnswer && (
                  <Markdown
                    key="back-answer"
                    className={`px-0 lg:px-6 ${isFullTab ? "text-xl" : "text-base lg:text-lg"} lg:mb-4`}
                  >
                    {flashcard.answer}
                  </Markdown>
                )}
                {showExplanation && flashcard.explanation && (
                  <div className="flex flex-col space-y-4 mt-4 mx-auto w-full justify-center items-center">
                    <Markdown
                      key="back-explanation"
                      className={isFullTab ? "text-lg" : "text-sm lg:text-base"}
                    >
                      {flashcard.explanation}
                    </Markdown>
                    {flashcard.source && (
                      <Badge
                        variant="secondary"
                        className="cursor-pointer hover:bg-secondary/80"
                        key="back-source"
                        onClick={(e) =>
                          onSource(
                            flashcard.source,
                            e,
                            flashcard.bbox
                              ? convertStringToBbox(flashcard.bbox)
                              : undefined,
                          )
                        }
                      >
                        {!isNaN(flashcard.source) && flashcard.source % 1 !== 0
                          ? formatMilliseconds(flashcard.source)
                          : t("flashcards.page") + " " + flashcard.source}
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
                    {showExplanation
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
  },
  (prevProps, nextProps) => {
    return (
      prevProps.flashcard._id === nextProps.flashcard._id &&
      prevProps.isFlipped === nextProps.isFlipped &&
      prevProps.showHint === nextProps.showHint &&
      prevProps.showExplanation === nextProps.showExplanation &&
      prevProps.showAnswer === nextProps.showAnswer &&
      prevProps.flashcard.is_starred === nextProps.flashcard.is_starred &&
      prevProps.flashcard.isVisible === nextProps.flashcard.isVisible
    );
  },
);
