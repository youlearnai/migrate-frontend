import FlashcardsManage from "./flashcards-manage";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import { useFlashcardStore } from "@/hooks/use-flashcard-store";
import { useParams } from "next/navigation";
import {
  useGetContent,
  useGetFlashcardActiveProgress,
  useGetFlashcards,
  useGetFlashcardsActiveRecall,
  useGetKeyConcepts,
} from "@/query-hooks/content";
import { toast } from "sonner";
import {
  useUpdateFlashcardsDailyReviewLimit,
  useUpdateFlashcardsLearningSteps,
  useGetFlashcardsLearningSteps,
} from "@/query-hooks/user";
import { Progress } from "../ui/progress";
import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { BookX, Sprout, Settings2 } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { differenceInSeconds } from "date-fns";
import { useMicStore } from "@/hooks/use-mic-store";
import { useModalStore } from "@/hooks/use-modal-store";
import { FlashcardSettingsFormData } from "@/lib/types";

type TimerState = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const Timer = ({
  initialSeconds,
  refetchProgress,
}: {
  initialSeconds: number;
  refetchProgress: () => void;
}) => {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState<TimerState>(() => {
    const days = Math.floor(initialSeconds / 86400);
    const hours = Math.floor((initialSeconds % 86400) / 3600);
    const minutes = Math.floor((initialSeconds % 3600) / 60);
    const seconds = initialSeconds % 60;
    return { days, hours, minutes, seconds };
  });

  const hasLoggedRef = useRef(false);

  useEffect(() => {
    const days = Math.floor(initialSeconds / 86400);
    const hours = Math.floor((initialSeconds % 86400) / 3600);
    const minutes = Math.floor((initialSeconds % 3600) / 60);
    const seconds = initialSeconds % 60;
    setTimeLeft({ days, hours, minutes, seconds });
    hasLoggedRef.current = false;
  }, [initialSeconds]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const totalSeconds =
          prev.days * 86400 +
          prev.hours * 3600 +
          prev.minutes * 60 +
          prev.seconds;

        if (totalSeconds <= 1) {
          if (!hasLoggedRef.current) {
            hasLoggedRef.current = true;
            setTimeout(() => {
              refetchProgress();
            }, 1000);
          }
          return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }

        const newTotal = totalSeconds - 1;
        const days = Math.floor(newTotal / 86400);
        const hours = Math.floor((newTotal % 86400) / 3600);
        const minutes = Math.floor((newTotal % 3600) / 60);
        const seconds = newTotal % 60;

        return { days, hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (time: TimerState) => {
    const parts = [];

    if (time.days > 0) parts.push(`${time.days}d`);
    if (time.hours > 0) parts.push(`${time.hours}h`);
    if (time.minutes > 0) parts.push(`${time.minutes}m`);
    if (time.seconds > 0 || parts.length === 0) parts.push(`${time.seconds}s`);

    return parts.join(" ");
  };

  return (
    <div className="flex flex-col items-center w-full justify-center gap-2">
      <div className="text-sm text-muted-foreground/80 mt-0">
        {t("flashcards.cardsWillBeAvailableIn")}
      </div>
      <div className="text-2xl font-semibold text-primary">
        {formatTime(timeLeft)}
      </div>
    </div>
  );
};

const CircularProgress = ({
  value,
  total,
}: {
  value: number;
  total: number;
}) => {
  const radius = 45;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const percentage = (value / total) * 100;
  let offset = circumference - (percentage / 100) * circumference;

  if (value > total) {
    offset = 0;
  }
  return (
    <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex flex-col items-center justify-center">
      <svg
        className="absolute top-0 left-0 w-full h-full"
        viewBox="0 0 100 100"
      >
        <circle
          className="text-primary/5 stroke-current dark:text-primary/10"
          strokeWidth={strokeWidth}
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
        ></circle>
        <circle
          className={`text-green-500 stroke-current`}
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
        ></circle>
      </svg>
      <span className="text-3xl sm:text-4xl font-bold text-neutral-700 dark:text-primary z-10">
        {value}
      </span>
    </div>
  );
};

const ValueSkeleton = ({ className }: { className?: string }) => (
  <Skeleton className={cn("h-6 w-8 rounded-sm", className)} />
);

export default function FlashcardsActiveIntro() {
  const { t } = useTranslation();
  const {
    setIntroSeen,
    setView,
    setCurrentIndex,
    displayModifiers: modifiers,
    setDisplayModifiers: setModifiers,
  } = useFlashcardStore();
  const params = useParams();
  const { data: content } = useGetContent(
    params.spaceId as string,
    params.contentId as string,
    { enabled: !!params.contentId },
    false,
  );
  const { editSession } = useFlashcardStore.getState();
  const hasChanges =
    Object.keys(editSession.editedCards).length > 0 ||
    editSession.deletedCardIds.length > 0;
  const { isRecording } = useMicStore();
  const {
    data: allCards,
    isLoading: allLoading,
    isRefetching: allRefetching,
  } = useGetFlashcards(params.contentId as string);

  const { isRefetching: todayRefetching, refetch: refetchToday } =
    useGetFlashcardsActiveRecall(params.contentId as string);

  const {
    data: progress,
    isLoading: progressLoading,
    isRefetching: progressRefetching,
    refetch: refetchProgress,
  } = useGetFlashcardActiveProgress(
    params.contentId as string,
    modifiers.showOnlyStarred,
    modifiers.selectedKeyConcepts || [],
    {
      enabled: !!allCards?.length,
    },
  );

  const { data: keyConcepts } = useGetKeyConcepts(params.contentId as string);
  const { data: learningStepsData } = useGetFlashcardsLearningSteps(
    params.contentId as string,
  );
  const { onOpen } = useModalStore();
  const { mutate: updateLimit, isPending: isUpdateLimitLoading } =
    useUpdateFlashcardsDailyReviewLimit();
  const { mutate: updateLearningSteps } = useUpdateFlashcardsLearningSteps();

  const handleStart = async () => {
    if (hasChanges) {
      return toast.error(t("flashcards.saveChangesFirst"));
    }
    await refetchToday();
    setIntroSeen(params.contentId as string);
    setView("display", { contentId: params.contentId as string });
    setCurrentIndex(0);
  };

  const handleSettingsSubmit = useCallback(
    (data: FlashcardSettingsFormData) => {
      const { dirtyFields } = data;
      let hasUpdates = false;

      // Handle daily limit update
      if (dirtyFields?.dailyLimit) {
        hasUpdates = true;
        updateLimit(
          {
            flashcardsDailyReviewLimit: data.dailyLimit,
            contentId: params.contentId as string,
          },
          {
            onSuccess: () => {
              // Don't show individual toast here
            },
            onError: () => {
              toast.error(t("flashcards.limitUpdateError"));
            },
          },
        );
      }

      // Handle learning steps update - only if they've changed
      if (
        dirtyFields?.learningSteps &&
        data.learningSteps &&
        data.learningSteps.length > 0
      ) {
        hasUpdates = true;
        updateLearningSteps(
          {
            contentId: params.contentId as string,
            learningSteps: data.learningSteps,
          },
          {
            onSuccess: () => {
              // Don't show individual toast here
            },
            onError: () => {
              toast.error(t("flashcards.learningStepsUpdateError"));
            },
          },
        );
      }

      // Show single success toast if any updates were made
      if (hasUpdates) {
        toast.success(t("flashcards.preferencesUpdated"));
      }
    },
    [updateLimit, updateLearningSteps, params.contentId, t],
  );

  const handleOpenPreferences = useCallback(() => {
    onOpen("flashcardActiveRecallSettings", {
      contentId: params.contentId as string,
      onSubmit: handleSettingsSubmit,
      allCards: allCards,
      keyConcepts: keyConcepts,
      progress: progress,
      learningSteps: learningStepsData?.learning_steps || [60, 600],
    });
  }, [
    params.contentId,
    handleSettingsSubmit,
    onOpen,
    allCards,
    keyConcepts,
    progress,
    learningStepsData,
  ]);

  if (progressLoading || allLoading) {
    return (
      <div className="mt-24 flex justify-center items-center">
        <div className="">
          <span className="text-shimmer">{t("flashcards.generating")}</span>
        </div>
      </div>
    );
  }

  if (isRecording) {
    return (
      <div
        key="recording-container"
        className="flex my-4 justify-center h-full"
      >
        <p key="recording-message" className="text-primary/70 mt-6">
          {t("flashcards.record")}
        </p>
      </div>
    );
  }

  if (allCards && allCards?.length === 0) {
    if (content?.type === "conversation") {
      return (
        <div
          key="no-flashcards-container"
          className="w-full flex my-8 pb-6 justify-center"
        >
          <p key="no-flashcards-message" className="text-primary/70 mt-6">
            {t("flashcards.noConversationFlashcards")}
          </p>
        </div>
      );
    }

    return (
      <div
        key="no-flashcards-container"
        className="w-full flex my-8 pb-6 justify-center"
      >
        <p key="no-flashcards-message" className="text-primary/70 mt-6">
          {t("flashcards.noFlashcards")}
        </p>
      </div>
    );
  }

  const isNumberLoading =
    isUpdateLimitLoading || progressRefetching || allRefetching;

  return (
    <div className="mx-auto space-y-4 justify-center items-center">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium">
          {progress?.next_review_date
            ? t("flashcards.activeRecallIntro.title2")
            : t("flashcards.activeRecallIntro.title")}
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleOpenPreferences}
            disabled={!allCards || allCards.length === 0}
            className="h-8 w-8 border-none text-muted-foreground"
          >
            <Settings2 className="h-4 w-4" />
            <span className="sr-only">{t("flashcards.preferences")}</span>
          </Button>
        </div>
      </div>

      {progress?.next_review_date ? (
        <div className="rounded-2xl bg-muted/60 dark:bg-muted/40 p-6 justify-center items-center">
          <div className="flex items-center justify-center gap-6">
            <div className="relative w-full h-24 flex items-center justify-center">
              <Timer
                initialSeconds={differenceInSeconds(
                  new Date(progress?.next_review_date),
                  new Date(),
                )}
                refetchProgress={refetchProgress}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-muted/60 dark:bg-muted/40 p-6 justify-center items-center">
          <div className="flex items-center justify-center gap-6">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <CircularProgress
                value={
                  (progress?.completed_today?.new as number) +
                  (progress?.completed_today?.review as number)
                }
                total={
                  (progress?.completed_today?.new as number) +
                  (progress?.completed_today?.review as number) +
                  ((progress?.pending_for_today?.new as number) +
                    (progress?.pending_for_today?.review as number))
                }
              />
            </div>

            <div className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 text-2xl font-semibold">
                  <BookX className="h-4 w-4 text-muted-foreground/80 text-xl" />
                  {isNumberLoading ? (
                    <ValueSkeleton className="h-8 w-12" />
                  ) : (
                    progress?.pending_for_today?.new
                  )}
                </div>
                <div className="text-sm text-muted-foreground/80 mt-1 font-normal">
                  {t("flashcards.notStudied")}{" "}
                  <span className="text-muted-foreground/80 text-xs">
                    {modifiers.showOnlyStarred &&
                      `(${t("flashcards.starred")})`}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 text-2xl font-semibold">
                  <Sprout className="h-4 w-4 text-green-500 text-xl" />
                  {isNumberLoading ? (
                    <ValueSkeleton className="h-8 w-12" />
                  ) : (
                    progress?.pending_for_today?.review
                  )}
                </div>
                <div className="text-sm text-muted-foreground/80 mt-1 font-normal">
                  {t("flashcards.toReview")}{" "}
                  <span className="text-muted-foreground/80 text-xs">
                    {modifiers.showOnlyStarred &&
                      `(${t("flashcards.starred")})`}
                  </span>
                </div>
              </div>
              {/* {modifiers.showOnlyStarred && (
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 text-2xl font-semibold">
                  <Star className="h-4 w-4 text-yellow-500 text-xl" />
                  {starredCards?.length}
                </div>
                <div className="text-sm text-muted-foreground/80 mt-1 font-normal">
                  {t("flashcards.starred")}
                </div>
              </div>
            )} */}
            </div>
          </div>

          <div className="mt-4 flex justify-center">
            <Button
              className={cn(
                "w-72 rounded-2xl h-10",
                hasChanges && "opacity-50 cursor-not-allowed",
              )}
              onClick={handleStart}
              size="sm"
              disabled={todayRefetching}
            >
              {todayRefetching
                ? t("chats.loadingSkeleton.skeletonText1")
                : t("flashcards.studyCards")}
            </Button>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-medium mb-4 mt-10">
          {t("flashcards.deckProgress")}
        </h2>
        <div className="bg-muted/60 dark:bg-muted/40 p-4 rounded-2xl">
          <div className="flex text-sm text-muted-foreground/80 mb-1">
            <div className="mr-4 mb-1 items-center">
              <span className="inline-block w-2 h-2 bg-muted-foreground/50 rounded-full mr-2"></span>
              <span className="text-primary">
                {isNumberLoading ? (
                  <ValueSkeleton className="h-3 w-5 inline-block" />
                ) : (
                  progress?.overall_progress.new
                )}
              </span>{" "}
              <span className="text-muted-foreground/80">
                {t("flashcards.notStudied")}
              </span>
            </div>
            <div>
              <span className="inline-block w-2 h-2 bg-green-500/80 rounded-full mr-2"></span>
              <span className="text-primary">
                {isNumberLoading ? (
                  <ValueSkeleton className="h-3 w-5 inline-block" />
                ) : (
                  progress?.overall_progress.review
                )}
              </span>{" "}
              <span className="text-muted-foreground/80">
                {t("flashcards.toReview")}
              </span>
            </div>
          </div>
          <div className="w-full h-3 my-2 bg-muted/80 rounded-full overflow-hidden">
            <Progress
              value={
                ((progress?.overall_progress.review as number) /
                  allCards?.length) *
                100
              }
              parentClassName="h-3 w-full text-primary/5 stroke-current dark:text-primary/10"
              className="h-full bg-green-500 rounded-full"
            />
          </div>
        </div>
      </div>

      <div className="pt-6">
        <FlashcardsManage intro />
      </div>
    </div>
  );
}

export const FlashcardsActiveReviewDate = ({ date }: { date: Date }) => {
  const { t } = useTranslation();
  const { i18n } = useTranslation();
  const locale = i18n.language;

  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  const formattedDate = date.toLocaleDateString(locale, options);
  return (
    <div className="text-sm text-muted-foreground">
      {t("flashcards.reviewDate")}: {formattedDate}
    </div>
  );
};
