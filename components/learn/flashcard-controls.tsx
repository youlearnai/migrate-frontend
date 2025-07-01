import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useAuth from "@/hooks/use-auth";
import { hasChanges, useFlashcardStore } from "@/hooks/use-flashcard-store";
import { Flashcard } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  WalletCards,
  SlidersHorizontal,
} from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import React, { memo, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { useModalStore } from "@/hooks/use-modal-store";
import { useGetKeyConcepts } from "@/query-hooks/content";

type FlashcardControlsProps = {
  flashcards: Flashcard[];
  onNext?: () => void;
  onPrev?: () => void;
  canGoNext?: boolean;
  canGoPrev?: boolean;
  currentIndex?: number;
  totalCards?: number;
};

export const FlashcardControls = memo(function FlashcardControls({
  flashcards,
  onNext,
  onPrev,
  canGoNext = true,
  canGoPrev = true,
  currentIndex = 0,
  totalCards = 0,
}: FlashcardControlsProps) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const {
    setView,
    displayModifiers: modifiers,
    setDisplayModifiers: setModifiers,
  } = useFlashcardStore();
  const isLastCard = currentIndex === totalCards - 1;
  const { user } = useAuth();
  const { t } = useTranslation();
  const { data: keyConcepts } = useGetKeyConcepts(params.contentId as string);
  const { onOpen } = useModalStore();

  const onFinish = () => {
    setView("menu", {
      contentId: params.contentId as string,
    });
  };

  const handleManage = useCallback(async () => {
    if (user) {
      setView("manage", {
        contentId: params.contentId as string,
      });
    } else {
      router.push(`/signin?returnUrl=${encodeURIComponent(pathname)}`);
      toast.error(t("flashcards.signInToAccess"));
      return;
    }
  }, [params.contentId, setView, router, pathname]);

  const handleShuffleToggle = useCallback(
    (pressed: boolean) => {
      if (user) {
        setModifiers({
          ...modifiers,
          isShuffled: pressed,
        });
      } else {
        router.push(`/signin?returnUrl=${encodeURIComponent(pathname)}`);
        toast.error(t("flashcards.signInToAccess"));
      }
    },
    [user, setModifiers, modifiers, router, pathname, t],
  );

  const handleOpenFilterModal = useCallback(() => {
    if (user) {
      onOpen("flashcardFilter", { flashcards, keyConcepts });
    } else {
      router.push(`/signin?returnUrl=${encodeURIComponent(pathname)}`);
      toast.error(t("flashcards.signInToAccess"));
    }
  }, [user, onOpen, flashcards, keyConcepts, router, pathname, t]);

  const hasActiveFilters = useMemo(() => {
    return (
      modifiers.showOnlyStarred ||
      (modifiers.selectedKeyConcepts?.length ?? 0) > 0
    );
  }, [modifiers]);

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
                      disabled={!canGoNext}
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

        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManage}
              className="gap-2 flex items-center text-muted-foreground"
            >
              <WalletCards className="w-4 h-4 flex-shrink-0" />
              <span className="capitalize">{t("flashcards.manageCards")}</span>
            </Button>
            {hasChanges() && (
              <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-yellow-600 dark:bg-yellow-500 rounded-full" />
            )}
          </div>

          <div className="h-6 w-px bg-border" />

          <Button
            variant={hasActiveFilters ? "secondary" : "ghost"}
            size="sm"
            onClick={handleOpenFilterModal}
            className={cn(
              "gap-2 flex items-center text-muted-foreground",
              hasActiveFilters && "text-foreground",
            )}
          >
            <SlidersHorizontal className="w-4 h-4 flex-shrink-0" />
            <span>{t("flashcards.filterOptions")}</span>
            {hasActiveFilters && (
              <span className="ml-1 text-xs bg-background px-1.5 py-0.5 rounded-full">
                {(modifiers.showOnlyStarred ? 1 : 0) +
                  (modifiers.selectedKeyConcepts?.length ?? 0)}
              </span>
            )}
          </Button>

          <Button
            variant={modifiers.isShuffled ? "secondary" : "ghost"}
            size="sm"
            onClick={() => handleShuffleToggle(!modifiers.isShuffled)}
            className={cn(
              "gap-2 flex items-center text-muted-foreground",
              modifiers.isShuffled && "text-foreground",
            )}
          >
            <Shuffle className="w-4 h-4 flex-shrink-0" />
            <span>{t("flashcards.shuffle")}</span>
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
});
