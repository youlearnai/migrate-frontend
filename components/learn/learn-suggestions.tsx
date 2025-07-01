import React, { useEffect } from "react";
import { useChat, useGenerateLearnSuggestions } from "@/query-hooks/generation";
import { useParams } from "next/navigation";
import {
  BookOpen,
  Compass,
  CheckCircle,
  BookOpenCheck,
  MessageCircleQuestion,
  ChevronDown,
} from "lucide-react";
import { LearnSuggestion } from "@/lib/types";
import { useUserProfile } from "@/query-hooks/user";
import { useAgenticModeStore } from "@/hooks/use-agentic-mode-store";
import { useCurrentSourceStore } from "@/hooks/use-current-source-store";
import { useWebSearchStore } from "@/hooks/use-web-search-store";
import { useOS } from "@/hooks/use-os";
import LearnSuggestionsSkeleton from "@/components/skeleton/learn-suggestions-skeleton";
import { AnimatePresence, motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { useLocalStorage } from "usehooks-ts";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useCustomChatLoadingStore } from "@/hooks/use-custom-chat-loading-store";

const LearnSuggestions = ({
  chatSubmit,
}: {
  chatSubmit: (prompt: string) => void;
}) => {
  const params = useParams();
  const contentId = params.contentId as string;
  const spaceId = params.spaceId as string;
  const [isOpen, setIsOpen] = useLocalStorage("learn-suggestions-open", true);
  const { isAgentic } = useAgenticModeStore();
  const { currentSource } = useCurrentSourceStore();
  const { isWebSearch } = useWebSearchStore();
  const { isMac, isWindows } = useOS();
  const { t } = useTranslation();
  const isSpacePage = spaceId && !contentId;

  const {
    data: learnSuggestions,
    isLoading,
    isRefetching,
  } = useGenerateLearnSuggestions(
    contentId,
    spaceId,
    isSpacePage ? undefined : currentSource,
    {
      enabled: isOpen,
    },
  );
  const { loading: isSubmitting, streaming: isStreaming } = useChat();
  const { isLoading: isCustomLoading } = useCustomChatLoadingStore();

  const handleSuggestionClick = (suggestion: LearnSuggestion) => {
    if (!isOpen) return;
    chatSubmit(suggestion.prompt);
  };

  const shortcutUsedRef = React.useRef(false);

  useEffect(() => {
    if (
      isSubmitting ||
      isStreaming ||
      !learnSuggestions ||
      learnSuggestions.length === 0 ||
      !isOpen
    ) {
      return;
    }

    const handleKeyboardShortcut = (event: KeyboardEvent) => {
      if (!isOpen || shortcutUsedRef.current) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return false;
      }

      const isDigitKey = event.keyCode >= 49 && event.keyCode <= 57;
      const modifierPressed = isMac ? event.altKey : event.altKey;

      if (modifierPressed && isDigitKey) {
        const suggestionIndex = event.keyCode - 49;

        if (suggestionIndex < learnSuggestions.length) {
          shortcutUsedRef.current = true;

          event.preventDefault();
          event.stopImmediatePropagation();

          handleSuggestionClick(learnSuggestions[suggestionIndex]);

          setTimeout(() => {
            shortcutUsedRef.current = false;
          }, 1000);

          return false;
        }
      }
    };

    document.addEventListener("keydown", handleKeyboardShortcut, {
      capture: true,
    });

    return () => {
      document.removeEventListener("keydown", handleKeyboardShortcut, {
        capture: true,
      });
    };
  }, [
    learnSuggestions,
    handleSuggestionClick,
    isSubmitting,
    isStreaming,
    isMac,
    isOpen,
  ]);

  if (isSpacePage) {
    return null;
  }

  if (isSubmitting || isStreaming || isCustomLoading) {
    return null;
  }

  if (isLoading || isRefetching) {
    return <LearnSuggestionsSkeleton />;
  }

  if (isOpen && (!learnSuggestions || learnSuggestions.length === 0)) {
    return null;
  }

  const getIcon = (category: string) => {
    switch (category) {
      case "deepen":
        return <MessageCircleQuestion className="w-4 h-4" />;
      case "explore":
        return <Compass className="w-4 h-4" />;
      case "check":
        return <BookOpenCheck className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getShortcutSymbol = () => {
    if (isMac) return "⌥";
    if (isWindows) return "Alt";
    return "Alt"; // default for other OS
  };

  const handleAccordionChange = (value: string) => {
    setIsOpen(value === "learn-suggestions");
  };

  return (
    <AnimatePresence>
      <motion.div
        className="flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Accordion
          type="single"
          collapsible
          value={isOpen ? "learn-suggestions" : ""}
          onValueChange={handleAccordionChange}
          className="w-full"
        >
          <AccordionItem value="learn-suggestions" className="border-none">
            <AccordionTrigger showChevron={false} className="py-2 px-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-normal text-primary">
                  {t("learn.suggestions")}
                </h2>
                <ChevronDown
                  size={16}
                  className="transition-transform duration-200 shrink-0 data-[state=open]:rotate-180"
                  data-state={isOpen ? "open" : "closed"}
                />
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-x-2 gap-y-1 pt-2">
                {learnSuggestions?.map((suggestion: LearnSuggestion, index) => (
                  <div key={index} className="pb-1">
                    <motion.div
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="group flex items-center rounded-2xl justify-between px-2 bg-neutral-100/20 dark:bg-neutral-900/80 dark:hover:bg-primary/5 hover:bg-primary/5 border border-primary/10 hover:border-primary/5 cursor-pointer gap-2 min-h-14 group"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full border-muted text-primary/80 group-hover:text-primary flex items-center justify-center">
                          {getIcon(suggestion.category)}
                        </div>

                        <span className="text-primary/80 line-clamp-2 text-sm overflow-hidden group-hover:text-primary">
                          {suggestion.prompt}
                        </span>
                      </div>

                      <div className="w-fit px-1.5 h-7 gap-1 rounded-md border flex items-center justify-center text-muted-foreground text-xs border-primary/10">
                        <span className="command-symbol text-sm">
                          {getShortcutSymbol()}
                        </span>
                        <span>{index + 1}</span>
                      </div>
                    </motion.div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </motion.div>
    </AnimatePresence>
  );
};

export default LearnSuggestions;
