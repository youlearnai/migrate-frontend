import { Button } from "../ui/button";
import { useTranslation } from "react-i18next";
import { ActiveRecallFlashcard } from "@/lib/types";
import { useFlashcardRatings } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import * as locales from "date-fns/locale";
import { useParams } from "next/navigation";

export default function FlashcardControlsActive({
  isRevealed,
  onShowAnswer,
  onRate,
  currentIndex,
  totalCards,
  flashcards,
}: {
  isRevealed: boolean;
  onShowAnswer: () => void;
  onRate: (rating: number) => void;
  currentIndex: number;
  totalCards: number;
  flashcards: ActiveRecallFlashcard[];
}) {
  const { t } = useTranslation();
  const params = useParams();
  const locale = params.locale as string;
  const flashcardRatings = useFlashcardRatings();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isRevealed) {
        e.preventDefault();
        onShowAnswer();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRevealed, onShowAnswer]);

  const getRatingStyles = (rating: number) => {
    switch (rating) {
      case 1: // Again
        return "dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-950/50 dark:hover:text-red-400/50 bg-red-50 text-red-500 hover:bg-red-50/50 hover:text-red-500/50";
      case 2: // Hard
        return "dark:bg-yellow-950 dark:text-yellow-400 dark:hover:bg-yellow-950/50 dark:hover:text-yellow-400/50 bg-yellow-50 text-yellow-500 hover:bg-yellow-50/50 hover:text-yellow-500/50";
      case 3: // Good
        return "dark:bg-green-950 dark:text-green-400 dark:hover:bg-green-950/50 dark:hover:text-green-400/50 bg-green-50 text-green-500 hover:bg-green-50/50 hover:text-green-500/50";
      case 4: // Easy
        return "dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-950/50 dark:hover:text-blue-400/50 bg-blue-50 text-blue-500 hover:bg-blue-50/50 hover:text-blue-500/50";
      default:
        return "";
    }
  };

  return (
    <div className="mt-6">
      <div className="flex flex-col justify-center">
        {isRevealed && (
          <div className="flex justify-center flex-wrap gap-2 mt-0 w-fit mx-auto border rounded-2xl p-2">
            {flashcardRatings.map((r) => (
              <Button
                key={r.rating}
                size="sm"
                variant="outline"
                className={cn(
                  "flex flex-col gap-1 px-6 py-6 border-none",
                  getRatingStyles(r.rating),
                )}
                onClick={() => onRate(r.rating)}
              >
                <span>{r.label}</span>
                <span className="text-xs opacity-80">
                  {formatDistanceToNow(
                    flashcards[currentIndex].rating_previews[r.rating],
                    { locale: locales[locale as keyof typeof locales] },
                  )}
                </span>
              </Button>
            ))}
          </div>
        )}

        {!isRevealed && (
          <div className="flex justify-center my-2">
            <Button onClick={onShowAnswer} size="sm">
              {t("flashcards.showAnswer")}{" "}
              <span className="text-xs ml-1 opacity-70">
                {t("flashcards.spaceKey")}
              </span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
