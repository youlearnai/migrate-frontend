import { useMemo } from "react";
import { Flashcard } from "@/lib/types";

const VISIBLE_BUFFER = 3;

export function useVirtualCards(
  allCards: Flashcard[] | undefined,
  currentIndex: number,
) {
  const virtualCards = useMemo(() => {
    if (!allCards) return [];

    return allCards.map((card, index) => ({
      ...card,
      isVisible: Math.abs(index - currentIndex) <= VISIBLE_BUFFER,
    }));
  }, [allCards, currentIndex]);

  return {
    virtualCards,
    totalCards: allCards?.length || 0,
  };
}
