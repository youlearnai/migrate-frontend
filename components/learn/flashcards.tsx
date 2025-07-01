"use client";
import { TooltipProvider } from "@/components/ui/tooltip";
import useAuth from "@/hooks/use-auth";
import { useErrorStore } from "@/hooks/use-error-store";
import { useFlashcardStore } from "@/hooks/use-flashcard-store";
import { useMicStore } from "@/hooks/use-mic-store";
import { useSourceStore } from "@/hooks/use-source-store";
import { useVirtualCards } from "@/hooks/use-virtual-cards";
import {
  ActiveRecallFlashcard,
  BoundingBoxData,
  Flashcard,
  FlashcardMode,
} from "@/lib/types";
import {
  useGetContent,
  useGetFlashcards,
  useGradeFlashcardsActiveRecall,
  useGetFlashcardsActiveRecall,
  useGetFlashcardActiveProgress,
} from "@/query-hooks/content";
import { useGetTier } from "@/query-hooks/user";
import { useParams } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import { FlashcardCard } from "./flashcard-card";
import { FlashcardControls } from "./flashcard-controls";
import FlashcardsManage from "./flashcards-manage";
import FlashcardCardMenu from "./flashcards-menu";
import AuthRequired from "../auth/auth-required";
import { Progress } from "../ui/progress";
import FlashcardControlsActive from "./flashcard-controls-active";
import { ArrowLeft, Settings2 } from "lucide-react";
import { toast } from "sonner";
import {
  useUpdateFlashcardsDailyReviewLimit,
  useUpdateFlashcardsLearningSteps,
  useGetFlashcardsLearningSteps,
} from "@/query-hooks/user";
import { FlashcardSettingsFormData } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import { useModalStore } from "@/hooks/use-modal-store";
import { useGetKeyConcepts } from "@/query-hooks/content";

export default function Flashcards() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const params = useParams();
  const { onSource } = useSourceStore();
  const [isFlipped, setIsFlipped] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const { data: tier } = useGetTier();
  const { openModal } = useErrorStore();
  const [showAnswer, setShowAnswer] = useState(true);
  const { isRecording, isPending } = useMicStore();
  const contentId = params.contentId as string;
  const spaceId = params.spaceId as string;
  const { data: content } = useGetContent(spaceId, contentId, undefined, false);

  const {
    view,
    currentIndex,
    data,
    displayModifiers,
    setView,
    setCurrentIndex,
    setDisplayModifiers,
    mode,
  } = useFlashcardStore();
  const {
    data: flashcards,
    isLoading: flashcardsLoading,
    isRefetching: flashcardsRefetching,
    isError,
  } = mode === "activeRecall"
    ? useGetFlashcardsActiveRecall(contentId, displayModifiers)
    : useGetFlashcards(contentId, displayModifiers);
  const { mutate: gradeFlashcard } = useGradeFlashcardsActiveRecall();

  const { virtualCards } = useVirtualCards(flashcards, currentIndex);

  const resetCard = useCallback(() => {
    setIsFlipped(false);
    setShowExplanation(false);
    setShowHint(false);
    setShowAnswer(true);
  }, []);

  // Custom carousel navigation
  const goToSlide = useCallback(
    (index: number) => {
      if (!virtualCards) return;
      if (tier === "anonymous" && index > 0) {
        openModal({
          status: 401,
          statusText: "Sign in to continue",
        });
        goToSlide(0);
        return;
      }

      if (index >= 0 && index < virtualCards.length) {
        resetCard();
        setCurrentIndex(index);
      }
    },
    [virtualCards, tier, openModal, resetCard, setCurrentIndex],
  );

  const goToNext = useCallback(() => {
    // if (mode === "fastReview") {
    //   posthog.capture("fast_review_next");
    // }
    goToSlide(currentIndex + 1);
  }, [currentIndex, goToSlide]);

  const goToPrev = useCallback(() => {
    goToSlide(currentIndex - 1);
  }, [currentIndex, goToSlide]);

  const flipCard = (e: React.MouseEvent) => {
    if (isFlipped && mode === "activeRecall") return;
    e.stopPropagation();
    setIsFlipped((prev) => !prev);
  };

  const toggleExplanation = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowExplanation((prev) => !prev);
    setShowAnswer((prev) => !prev);
  };

  const toggleHint = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowHint((prev) => !prev);
  };

  const handleRated = (rating: number) => {
    const currentCardId = virtualCards[currentIndex]._id;

    gradeFlashcard(
      { flashcardId: currentCardId, rating },
      {
        onSuccess: () => {
          if (currentIndex === virtualCards.length - 1) {
            onFinish();
          } else {
            goToNext();
          }
        },
      },
    );
  };

  const onFinish = () => {
    setView("menu", {
      contentId: params.contentId as string,
    });
  };

  const handleSource = (
    source: number,
    e: React.MouseEvent,
    bbox?: BoundingBoxData | null,
  ) => {
    e.stopPropagation();
    onSource(source, bbox);
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Prevent space from scrolling the page
      if (e.key === " ") {
        setIsFlipped((prev) => !prev);
        return;
      }

      if (tier === "anonymous") {
        if (e.key === "ArrowRight") {
          openModal(
            {
              status: 402,
              statusText: "Upgrade to continue",
            },
            {
              source: "flashcards-arrow-right",
            },
          );
          return;
        }
      }
      if (e.key === "ArrowLeft") {
        goToPrev();
      } else if (e.key === "ArrowRight") {
        goToNext();
      }
    },
    [tier, goToPrev, goToNext, openModal],
  );

  useEffect(() => {
    if (mode === "activeRecall") return;
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown, mode]);

  const handleShowAll = () => {
    setDisplayModifiers({ showOnlyStarred: false, selectedKeyConcepts: [] });
  };

  useEffect(() => {
    if (
      flashcards &&
      flashcards?.length > 0 &&
      currentIndex >= flashcards?.length
    ) {
      setCurrentIndex(flashcards?.length - 1);
    }
  }, [currentIndex, flashcards]);

  const renderViews = () => {
    switch (view) {
      case "menu":
        return (
          <FlashcardCardMenu
            key="flashcard-menu"
            flashcards={flashcards || []}
            totalCards={flashcards?.length || 0}
          />
        );
      case "manage":
        return <FlashcardsManage key="flashcard-manage" />;
      default:
        if (!virtualCards) {
          return (
            <div
              className="w-full"
              role="region"
              aria-roledescription="carousel"
            >
              <div className="w-full" />
              <FlashcardControls
                key="flashcard-controls"
                flashcards={flashcards || []}
              />
            </div>
          );
        }
        return (
          <div className="w-full relative">
            {mode === "activeRecall" && (
              <ActiveRecallManagementOptions flashcards={flashcards} />
            )}
            {mode === "activeRecall" && (
              <div className="mb-6 flex justify-center items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {currentIndex}
                </span>
                <Progress
                  className="bg-green-500 rounded-full transition-all duration-300 opacity-80"
                  parentClassName="h-3 w-full transition-all duration-300"
                  value={
                    flashcards &&
                    flashcards?.length > 0 &&
                    currentIndex !== undefined
                      ? (currentIndex / flashcards.length) * 100
                      : 0
                  }
                />
                <span className="text-sm text-muted-foreground">
                  {flashcards?.length}
                </span>
              </div>
            )}

            <div
              ref={carouselRef}
              className="w-full overflow-hidden"
              role="region"
              aria-roledescription="carousel"
            >
              <div className="w-full">
                {virtualCards[currentIndex] && (
                  <FlashcardCard
                    key={`card-${virtualCards[currentIndex]._id}`}
                    flashcard={virtualCards[currentIndex]}
                    isFlipped={isFlipped}
                    showHint={showHint}
                    showExplanation={showExplanation}
                    showAnswer={showAnswer}
                    onFlip={flipCard}
                    onToggleHint={toggleHint}
                    onToggleExplanation={toggleExplanation}
                    onSource={handleSource}
                  />
                )}
              </div>
            </div>

            {mode === "activeRecall" ? (
              <FlashcardControlsActive
                isRevealed={isFlipped}
                onShowAnswer={() => setIsFlipped(true)}
                onRate={handleRated}
                currentIndex={currentIndex}
                totalCards={virtualCards?.length || 0}
                flashcards={flashcards as ActiveRecallFlashcard[]}
              />
            ) : (
              <FlashcardControls
                key="flashcard-controls"
                flashcards={flashcards || []}
                onNext={goToNext}
                onPrev={goToPrev}
                canGoNext={currentIndex < (virtualCards?.length || 0) - 1}
                canGoPrev={currentIndex > 0}
                currentIndex={currentIndex}
                totalCards={virtualCards?.length || 0}
              />
            )}
          </div>
        );
    }
  };

  if (
    mode === "activeRecall" &&
    !flashcardsLoading &&
    !flashcardsRefetching &&
    flashcards &&
    flashcards.length === 0
  ) {
    if (displayModifiers.showOnlyStarred) {
      return (
        <div className="w-full flex flex-col justify-center items-center rounded-lg p-4">
          <ActiveRecallManagementOptions
            items={{ back: true, settings: false }}
            flashcards={flashcards}
          />
          <span className="text-muted-foreground text-center">
            {t("flashcards.noStarredToast")}
          </span>
          <Button size="sm" onClick={handleShowAll} className="text-sm mt-6">
            {t("flashcards.showAll")}
          </Button>
        </div>
      );
    }

    if (
      displayModifiers.selectedKeyConcepts &&
      displayModifiers.selectedKeyConcepts.length > 0
    ) {
      return (
        <div className="w-full flex flex-col justify-center items-center rounded-lg p-4">
          <ActiveRecallManagementOptions
            items={{ back: true, settings: false }}
            flashcards={flashcards}
          />
          <span className="text-muted-foreground text-center">
            {t("flashcards.noKeyConcepts")}
          </span>
          <Button size="sm" onClick={handleShowAll} className="text-sm mt-6">
            {t("flashcards.showAll")}
          </Button>
        </div>
      );
    }
  }

  if (isError) {
    return (
      <div key="error-container" className="w-full flex justify-center mt-4">
        {!user ? (
          <AuthRequired message={t("flashcards.auth.message")} />
        ) : (
          <span className="text-muted-foreground text-center">
            {t("flashcards.noFlashcards")}
          </span>
        )}
      </div>
    );
  }

  if (flashcardsLoading || isPending || loading) {
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

  if (
    flashcards &&
    flashcards?.length === 0 &&
    content?.type === "conversation"
  ) {
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

  if (flashcards && flashcards?.length === 0) {
    if (displayModifiers.showOnlyStarred) {
      return (
        <div
          key="no-starred-container"
          className="w-full flex flex-col items-center my-8 pb-6 justify-center"
        >
          <p key="no-starred-message" className="text-primary/70">
            {t("flashcards.noStarredToast")}
          </p>
          <Button
            key="show-all-button"
            onClick={handleShowAll}
            size="sm"
            className="text-sm mt-6"
          >
            {t("flashcards.showAll")}
          </Button>
        </div>
      );
    }
    if (
      displayModifiers.selectedKeyConcepts &&
      displayModifiers.selectedKeyConcepts.length > 0
    ) {
      return (
        <div className="w-full flex flex-col justify-center items-center rounded-lg p-4">
          <span className="text-muted-foreground text-center">
            {t("flashcards.noKeyConcepts")}
          </span>
          <Button
            key="show-all-button"
            onClick={handleShowAll}
            size="sm"
            className="text-sm mt-6"
          >
            {t("flashcards.showAll")}
          </Button>
        </div>
      );
    }
    if (mode === "fastReview") {
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
  }

  return (
    <div
      key="flashcards-container"
      className="w-full min-h-[calc(100vh-170px)]flex justify-center"
    >
      <TooltipProvider>
        <div key="flashcards-content" className="w-full px-0">
          {renderViews()}
        </div>
      </TooltipProvider>
    </div>
  );
}

function ActiveRecallManagementOptions({
  flashcards,
  items = { back: true, settings: true },
}: {
  flashcards: Flashcard[];
  items?: {
    back: boolean;
    settings: boolean;
  };
}) {
  const params = useParams();
  const { user } = useAuth();
  const { setView, displayModifiers, setCurrentIndex } = useFlashcardStore();
  const { t } = useTranslation();
  const { onOpen } = useModalStore();
  const showIntroActiveRecall = useFlashcardStore(
    (state) => state.showIntroActiveRecall,
  );
  const { data: progress } = useGetFlashcardActiveProgress(
    params.contentId as string,
    displayModifiers.showOnlyStarred,
    displayModifiers.selectedKeyConcepts || [],
    { enabled: !!params.contentId },
  );
  const { data: keyConcepts } = useGetKeyConcepts(params.contentId as string);
  const { data: learningStepsData } = useGetFlashcardsLearningSteps(
    params.contentId as string,
  );
  const queryClient = useQueryClient();
  const { mutate: updateLimit } = useUpdateFlashcardsDailyReviewLimit();
  const { mutate: updateLearningSteps } = useUpdateFlashcardsLearningSteps();

  const handleDashboard = useCallback(() => {
    setView("activeRecallIntro", {
      contentId: params.contentId as string,
    });
    queryClient.invalidateQueries({
      queryKey: ["getFlashcardActiveProgress", user?.uid, params.contentId],
    });
    queryClient.invalidateQueries({
      queryKey: ["getAllFlashcardsActiveRecall", user?.uid!, params.contentId],
    });
    showIntroActiveRecall(params.contentId as string);
  }, [user, params.contentId, setView, showIntroActiveRecall, queryClient]);

  const handleSettingsSubmit = (data: FlashcardSettingsFormData) => {
    // The modal updates the store directly for selectedKeyConcepts
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
            setCurrentIndex(0);
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
            setCurrentIndex(0);
          },
          onError: () => {
            toast.error(t("flashcards.learningStepsUpdateError"));
          },
        },
      );
    }

    // Reset index when filters change or updates are made
    if (
      hasUpdates ||
      displayModifiers.showOnlyStarred !== data.starredOnly ||
      JSON.stringify(displayModifiers.selectedKeyConcepts) !==
        JSON.stringify(data.selectedKeyConcepts)
    ) {
      setCurrentIndex(0);
    }

    if (hasUpdates) {
      toast.success(t("flashcards.limitUpdated"));
    }
  };

  const handleOpenPreferences = useCallback(() => {
    onOpen("flashcardActiveRecallSettings", {
      contentId: params.contentId as string,
      onSubmit: handleSettingsSubmit,
      allCards: flashcards,
      keyConcepts: keyConcepts,
      progress: progress,
      learningSteps: learningStepsData?.learning_steps || [60, 600],
    });
  }, [
    params.contentId,
    handleSettingsSubmit,
    onOpen,
    flashcards,
    keyConcepts,
    progress,
    learningStepsData,
  ]);

  return (
    <div className="flex justify-between items-center w-full mb-2 mt-[-28]">
      {items.back && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDashboard}
          className="gap-2 flex items-center text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4 flex-shrink-0" />
          <span>{t("studyGuide.back")}</span>
        </Button>
      )}
      {items.settings && (
        <Button
          variant="outline"
          size="icon"
          onClick={handleOpenPreferences}
          disabled={!flashcards || flashcards.length === 0}
          className="h-8 w-8 border-none text-muted-foreground"
        >
          <Settings2 className="h-4 w-4" />
          <span className="sr-only">{t("flashcards.preferences")}</span>
        </Button>
      )}
    </div>
  );
}
