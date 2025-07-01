import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  Star,
  RotateCcw,
  ArrowLeft,
  WalletCards,
  BookOpen,
  XCircle,
  AlertCircle,
  ThumbsUp,
  PartyPopper,
  MessageSquare,
} from "lucide-react";
import { hasChanges, useFlashcardStore } from "@/hooks/use-flashcard-store";
import { useModalStore } from "@/hooks/use-modal-store";
import { useParams } from "next/navigation";
import { Flashcard } from "@/lib/types";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import useAuth from "@/hooks/use-auth";
import { useGetFlashcardActiveReviewLogs } from "@/query-hooks/content";
import { cn } from "@/lib/utils";
import { FlashcardsMenuSkeleton } from "@/components/skeleton/flashcards-manage-skeleton";

export default function FlashcardCardMenu({
  flashcards,
  totalCards,
}: {
  flashcards: Flashcard[];
  totalCards: number;
}) {
  const params = useParams();
  const { user } = useAuth();
  const { onOpen } = useModalStore();
  const {
    setView,
    setCurrentIndex,
    displayModifiers,
    setDisplayModifiers,
    mode,
    showIntroActiveRecall,
  } = useFlashcardStore();
  const {
    data: reviewLogs,
    isLoading: reviewLogsLoading,
    isRefetching: reviewLogsRefetching,
  } = useGetFlashcardActiveReviewLogs(
    params.contentId as string,
    flashcards.map((flashcard) => flashcard._id),
    {
      enabled: !!flashcards && mode === "activeRecall",
    },
  );
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const againCount = useMemo(() => {
    return reviewLogs?.flashcards_review_logs?.filter(
      (log) => log?.most_recent_rating === 1,
    ).length;
  }, [reviewLogs]);

  const hardCount = useMemo(() => {
    return reviewLogs?.flashcards_review_logs?.filter(
      (log) => log.most_recent_rating === 2,
    ).length;
  }, [reviewLogs]);

  const goodCount = useMemo(() => {
    return reviewLogs?.flashcards_review_logs?.filter(
      (log) => log.most_recent_rating === 3,
    ).length;
  }, [reviewLogs]);

  const easyCount = useMemo(() => {
    return reviewLogs?.flashcards_review_logs?.filter(
      (log) => log.most_recent_rating === 4,
    ).length;
  }, [reviewLogs]);

  const hasStarredFlashcards = useMemo(() => {
    return flashcards?.some((flashcard) => flashcard.is_starred);
  }, [flashcards]);

  const goBack = () => {
    setView("display", {
      contentId: params.contentId as string,
    });
    setCurrentIndex(totalCards - 1);
  };

  const restart = () => {
    setDisplayModifiers({
      ...displayModifiers,
      showOnlyStarred: false,
    });
    setCurrentIndex(0);
    setView("display", {
      contentId: params.contentId as string,
    });
    queryClient.invalidateQueries({
      queryKey: ["generateFlashcards", user?.uid, params.contentId],
    });
  };

  const handleManage = () => {
    setView("manage", {
      contentId: params.contentId as string,
    });
  };

  const handleStarred = () => {
    setCurrentIndex(0);
    setDisplayModifiers({
      ...displayModifiers,
      showOnlyStarred: true,
    });
    setView("display", {
      contentId: params.contentId as string,
    });
  };

  const handleDashboard = () => {
    queryClient.invalidateQueries({
      queryKey: ["getFlashcardActiveProgress", user?.uid, params.contentId],
    });
    queryClient.invalidateQueries({
      queryKey: ["getAllFlashcardsActiveRecall", user?.uid!, params.contentId],
    });
    showIntroActiveRecall(params.contentId as string);
    setView("display", {
      contentId: params.contentId as string,
    });
    setCurrentIndex(0);
  };

  const handleFeedback = () => {
    onOpen("flashcardFeedback");
  };

  if (reviewLogsLoading || reviewLogsRefetching) {
    return <FlashcardsMenuSkeleton />;
  }

  return (
    <div className="w-full">
      <div className="my-6 flex justify-center">
        <div className="group relative rounded-3xl animate-bounce-slow shadow-none">
          {/* Diffused outer glow */}
          <div className="absolute inset-0 -m-4 rounded-[40px] bg-gradient-to-r from-emerald-500/5 via-green-300/5 to-transparent blur-3xl dark:from-green-700/10 dark:via-emerald-600/5 dark:to-transparent" />

          <div className="relative z-10 flex justify-center p-8">
            <PartyPopper
              className="h-20 w-20 text-green-500 dark:text-green-400 drop-shadow-[0_0_15px_rgba(0,200,100,0.2)] group-hover:scale-110 transition-transform duration-300"
              strokeWidth={1.5}
            />
          </div>

          {/* Ultra soft glow effect */}
          <div className="absolute inset-0 -m-2 bg-gradient-radial from-green-300/10 to-transparent dark:from-green-500/15 dark:to-transparent blur-2xl opacity-60 animate-pulse-glow" />

          {/* Subtle light particles */}
          <div
            className="absolute top-0 left-1/4 h-1 w-1 rounded-full bg-green-300/40 shadow-[0_0_15px_5px_rgba(0,255,150,0.15)] dark:bg-green-500/40 dark:shadow-[0_0_15px_5px_rgba(0,255,150,0.15)]"
            style={{ top: "20%", left: "25%" }}
          ></div>
          <div
            className="absolute top-0 right-1/4 h-1.5 w-1.5 rounded-full bg-green-200/50 shadow-[0_0_15px_5px_rgba(0,255,150,0.2)] dark:bg-green-400/50 dark:shadow-[0_0_15px_5px_rgba(0,255,150,0.2)]"
            style={{ top: "30%", right: "35%" }}
          ></div>
          <div
            className="absolute bottom-0 right-1/3 h-1 w-1 rounded-full bg-green-300/40 shadow-[0_0_15px_5px_rgba(0,255,150,0.15)] dark:bg-green-500/40 dark:shadow-[0_0_15px_5px_rgba(0,255,150,0.15)]"
            style={{ bottom: "25%", right: "30%" }}
          ></div>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        {/* <FlashcardsGenerateMoreButton /> */}

        {hasStarredFlashcards && mode === "fastReview" && (
          <Button
            variant="outline"
            onClick={handleStarred}
            className="w-full justify-between items-center py-6 text-md font-normal rounded-xl transition-colors duration-200 hover:bg-muted"
          >
            <div className="flex items-center gap-4">
              <Star className="w-5 h-5 text-primary" />
              <span>{t("flashcards.studyStarred")}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-primary" />
          </Button>
        )}

        {mode === "fastReview" && (
          <Button
            variant="outline"
            className="w-full justify-between items-center py-6 text-md font-normal rounded-xl transition-colors duration-200 hover:bg-muted"
            onClick={restart}
          >
            <div className="flex items-center gap-4">
              <RotateCcw className="w-5 h-5 text-primary" />
              <span>{t("flashcards.restartAll")}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-primary" />
          </Button>
        )}

        {mode === "activeRecall" && reviewLogs && (
          <div className="">
            <div className="flex flex-col items-center justify-center mb-6 text-center">
              <span className="text-2xl font-medium">
                {t("flashcards.congratulations")}
              </span>
              <span className="text-base font-medium text-muted-foreground mt-2">
                {reviewLogs.flashcards_review_logs.length > 1
                  ? t("flashcards.completedCards", {
                      count: reviewLogs.flashcards_review_logs.length,
                    })
                  : t("flashcards.completedCard", {
                      count: reviewLogs.flashcards_review_logs.length,
                    })}
              </span>
            </div>

            <div className="">
              <div className="grid grid-cols-4 gap-3">
                <div className="relative flex flex-col items-center rounded-lg p-3 bg-red-50/80 dark:bg-red-950/50 backdrop-blur-sm overflow-hidden shadow-sm dark:shadow-red-900/20">
                  <XCircle className="relative z-10 h-5 w-5 mb-1 text-red-500 dark:text-red-400" />
                  <span className="relative z-10 text-lg font-medium text-red-500 dark:text-red-400">
                    {againCount}
                  </span>
                  <span className="relative z-10 text-xs text-red-500 dark:text-red-400">
                    {t("flashcards.again")}
                  </span>
                </div>

                <div className="relative flex flex-col items-center rounded-lg p-3 bg-yellow-50/80 dark:bg-yellow-950/50 backdrop-blur-sm overflow-hidden shadow-sm dark:shadow-yellow-900/20">
                  <AlertCircle className="relative z-10 h-5 w-5 mb-1 text-orange-400 dark:text-orange-400" />
                  <span className="relative z-10 text-lg font-medium text-orange-500 dark:text-orange-400">
                    {hardCount}
                  </span>
                  <span className="relative z-10 text-xs text-orange-500 dark:text-orange-400">
                    {t("flashcards.hard")}
                  </span>
                </div>

                <div className="relative flex flex-col items-center rounded-lg p-3 bg-green-50/80 dark:bg-green-950/50 backdrop-blur-sm overflow-hidden shadow-sm dark:shadow-green-900/20">
                  <BookOpen className="relative z-10 h-5 w-5 mb-1 text-green-400 dark:text-green-400" />
                  <span className="relative z-10 text-lg font-medium text-green-500 dark:text-green-400">
                    {goodCount}
                  </span>
                  <span className="relative z-10 text-xs text-green-500 dark:text-green-400">
                    {t("flashcards.good")}
                  </span>
                </div>

                <div className="relative flex flex-col items-center rounded-lg p-3 bg-blue-50/80 dark:bg-blue-950/50 backdrop-blur-sm overflow-hidden shadow-sm dark:shadow-blue-900/20">
                  <ThumbsUp className="relative z-10 h-5 w-5 mb-1 text-blue-400 dark:text-blue-400" />
                  <span className="relative z-10 text-lg font-medium text-blue-500 dark:text-blue-400">
                    {easyCount}
                  </span>
                  <span className="relative z-10 text-xs text-blue-500 dark:text-blue-400">
                    {t("flashcards.easy")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-2">
        {mode === "fastReview" && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 flex items-center text-muted-foreground hover:text-foreground"
              onClick={goBack}
            >
              <ArrowLeft className="w-4 h-4 flex-shrink-0" />
              <span>{t("flashcards.goBack")}</span>
            </Button>

            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleManage}
                className="gap-2 flex items-center text-muted-foreground hover:text-foreground"
              >
                <WalletCards className="w-4 h-4 flex-shrink-0" />
                <span>{t("flashcards.manageCards")}</span>
              </Button>
              {hasChanges() && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full" />
              )}
            </div>
          </>
        )}
      </div>

      {mode === "activeRecall" && (
        <div className="flex justify-center mt-[-8]">
          <Button
            className={cn(
              "w-72 rounded-2xl h-10 flex items-center justify-center gap-1",
              hasChanges() && "opacity-50 cursor-not-allowed",
            )}
            onClick={handleDashboard}
            size="sm"
          >
            <span>{t("flashcards.ToDashboard")}</span>
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
          </Button>
        </div>
      )}

      {mode === "activeRecall" && (
        <div className="my-2 flex justify-center flex-col items-center">
          <Button
            variant="ghost"
            onClick={handleFeedback}
            className="text-muted-foreground rounded-2xl hover:text-primary transition-all hover:bg-transparent hover:scale-105"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            {t("feedback.submit")}
          </Button>
        </div>
      )}
    </div>
  );
}
