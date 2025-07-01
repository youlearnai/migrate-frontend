import {
  Content,
  ContentType,
  FlashcardsResponseChunk,
  GenUiFlashcardCardState,
  GenUiFlashcardData,
} from "@/lib/types";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import GenUiFlashcardCard from "./gen-ui-flashcard-card";
import GenUiFlashcardControls from "./gen-ui-flashcard-controls";
import { Button } from "../ui/button";
import { Plus, RotateCcw } from "lucide-react";
import { useParams } from "next/navigation";
import { useAddFlashcardFromChat } from "@/query-hooks/generation";
import { toast } from "sonner";
import Spinner from "../global/spinner";

const GenUiFlashcards = ({
  chunk,
  chatMessageId,
  content,
}: {
  chunk: FlashcardsResponseChunk;
  chatMessageId: string;
  content?: Content;
}) => {
  const params = useParams();
  const contentId = params.contentId as string;
  const cardRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const [genUiQuizData, setGenUiQuizData] = useState<GenUiFlashcardData>({
    view: "practice",
    currentIndex: 0,
  });
  const [cardState, setCardState] = useState<GenUiFlashcardCardState>({
    isFlipped: false,
    showHint: false,
    showExplanation: false,
    showAnswer: true,
  });
  const currentIndex = genUiQuizData.currentIndex;
  const currentFlashcard = chunk.flashcards?.[currentIndex];
  const isLastQuestion = currentIndex === chunk.flashcards.length - 1;
  const isCompleted = genUiQuizData.view === "display";
  const { mutate: addFlashcardFromChat, isPending: isAddingFlashcard } =
    useAddFlashcardFromChat();

  // Handle empty flashcards array
  if (!chunk?.flashcards || chunk?.flashcards?.length === 0) {
    return (
      <div className="w-full h-[250px] flex flex-col space-y-2 items-center justify-center relative my-3 border rounded-2xl px-4 py-3 pb-5 bg-neutral-100/20 dark:bg-neutral-800/50 dark:border-primary/10">
        <span className="text-muted-foreground">
          {t("noFlashcardsGenerated")}
        </span>
      </div>
    );
  }

  const handlePrev = () => {
    setGenUiQuizData({ ...genUiQuizData, currentIndex: currentIndex - 1 });
    setCardState({
      ...cardState,
      isFlipped: false,
      showHint: false,
      showExplanation: false,
      showAnswer: true,
    });
  };

  const handleNext = () => {
    setGenUiQuizData({ ...genUiQuizData, currentIndex: currentIndex + 1 });
    setCardState({
      ...cardState,
      isFlipped: false,
      showHint: false,
      showExplanation: false,
      showAnswer: true,
    });
  };

  const handleFinish = () => {
    setGenUiQuizData({ ...genUiQuizData, view: "display" });
  };

  const handleTryAgain = () => {
    setCardState({
      isFlipped: false,
      showHint: false,
      showExplanation: false,
      showAnswer: true,
    });
    setGenUiQuizData({ currentIndex: 0, view: "practice" });
  };

  const handleAddToFlashcardsSet = () => {
    addFlashcardFromChat(
      {
        contentId,
        flashcards: chunk.flashcards.map((flashcard) => ({
          question: flashcard.question,
          answer: flashcard.answer,
          hint: flashcard.hint,
          explanation: flashcard.explanation,
          source: flashcard.source,
          key_concept:
            flashcard.key_concept?._id || (flashcard.key_concept?.id as string),
          bbox: flashcard.bbox as string,
        })),
      },
      {
        onSuccess: () => {
          toast.success(t("flashcards.flashcardAdded"));
        },
      },
    );
  };

  if (isCompleted) {
    return (
      <div className="w-full max-h-[calc(100vh-285px)] aspect-[4/3] flex flex-col space-y-2 items-center justify-center relative my-3 border rounded-2xl px-4 py-3 pb-5 bg-neutral-100/20 dark:bg-neutral-800/50">
        <span className="text-lg font-medium mb-2">
          {t("flashcards.finishedFlashcards")}
        </span>
        <div className="flex gap-2 flex-wrap justify-center">
          {contentId && (
            <Button
              className="gap-2"
              variant="default"
              onClick={handleAddToFlashcardsSet}
            >
              {isAddingFlashcard ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span>{t("flashcards.addToFlashcardsSet")}</span>
            </Button>
          )}
          <Button className="gap-2" variant="outline" onClick={handleTryAgain}>
            <RotateCcw className="h-4 w-4" />
            <span>{t("flashcards.restartAll")}</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative my-3 border rounded-2xl px-4 py-4 pb-7 bg-neutral-100/20 dark:bg-neutral-800/50">
      <GenUiFlashcardCard
        ref={cardRef}
        flashcard={currentFlashcard}
        cardState={cardState}
        setCardState={setCardState}
        contentType={content?.type as ContentType}
      />
      <GenUiFlashcardControls
        currentIndex={currentIndex}
        totalCards={chunk.flashcards.length}
        isLastCard={isLastQuestion}
        onPrev={handlePrev}
        onNext={handleNext}
        canGoPrev={currentIndex > 0}
        onFinish={handleFinish}
      />
    </div>
  );
};

export default GenUiFlashcards;
