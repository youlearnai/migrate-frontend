"use client";

import type React from "react";

import {
  createContext,
  useContext,
  useState,
  type HTMLAttributes,
  type PropsWithChildren,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

interface StackingCardsProps
  extends PropsWithChildren,
    HTMLAttributes<HTMLDivElement> {
  totalCards: number;
}

interface StackingCardItemProps
  extends HTMLAttributes<HTMLDivElement>,
    PropsWithChildren {
  index: number;
}

export default function StackingCards({
  children,
  className,
  totalCards,
  ...props
}: StackingCardsProps) {
  const [visibleCards, setVisibleCards] = useState<number[]>(
    Array.from({ length: totalCards }, (_, i) => i),
  );

  const getCardPosition = (index: number) => {
    return visibleCards.indexOf(index);
  };

  const isActiveCard = (index: number) => {
    const position = visibleCards.indexOf(index);
    const totalVisible = visibleCards.length;
    return position === totalVisible - 1;
  };

  return (
    <StackingCardsContext.Provider
      value={{
        visibleCards,
        setVisibleCards,
        totalCards,
        getCardPosition,
        isActiveCard,
      }}
    >
      <div className={cn("relative", className)} {...props}>
        {children}
      </div>
    </StackingCardsContext.Provider>
  );
}

const StackingCardItem = ({
  index,
  className,
  children,
  ...props
}: StackingCardItemProps) => {
  const { visibleCards } = useStackingCardsContext();

  const isVisible = visibleCards.includes(index);
  const position = visibleCards.indexOf(index);
  const totalVisible = visibleCards.length;

  const getScale = () => {
    if (!isVisible) return 0;
    const reversePosition = totalVisible - position - 1;
    return 1 - reversePosition * 0.05;
  };

  const getOpacity = () => {
    if (!isVisible) return 0;
    const reversePosition = totalVisible - position - 1;
    return Math.max(0.02, 1 - reversePosition * 0.2);
  };

  const getTopOffset = () => {
    if (!isVisible) return 0;
    return position * 8;
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={cn("absolute left-0 right-0 mx-auto origin-top", className)}
        style={{
          zIndex: position + 1,
          top: `${getTopOffset()}px`,
          scale: getScale(),
          opacity: getOpacity(),
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: getOpacity(),
          scale: getScale(),
        }}
        exit={{ opacity: 0, scale: 0.8, y: -30 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

const StackingCardsContext = createContext<{
  visibleCards: number[];
  setVisibleCards: React.Dispatch<React.SetStateAction<number[]>>;
  totalCards: number;
  getCardPosition: (index: number) => number;
  isActiveCard: (index: number) => boolean;
} | null>(null);

export const useStackingCardsContext = () => {
  const context = useContext(StackingCardsContext);
  if (!context)
    throw new Error("StackingCardItem must be used within StackingCards");
  return context;
};

export { StackingCardItem };
