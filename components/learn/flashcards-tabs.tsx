import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Flashcards from "./flashcards";
import FlashcardsActive from "./flashcards-active";
import { useFlashcardStore } from "@/hooks/use-flashcard-store";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Badge } from "../ui/badge";
import { useEffect } from "react";

export default function FlashcardsTabs() {
  const {
    mode,
    setMode,
    view,
    introSeenActiveRecall,
    setView,
    setCurrentIndex,
    setDisplayModifiers,
    clearEditSession,
    data,
  } = useFlashcardStore();
  const params = useParams();
  const contentId = params.contentId as string;
  const { t } = useTranslation();

  const tab = mode === "activeRecall" ? "active" : "fast";

  const handleChange = (value: string) => {
    setMode(value === "active" ? "activeRecall" : "fastReview");
  };

  const hideTabsList =
    mode === "activeRecall" &&
    view === "display" &&
    introSeenActiveRecall[contentId];

  useEffect(() => {
    if (data?.contentId !== contentId) {
      setView("display", {
        contentId: contentId,
      });
      setCurrentIndex(0);
      setDisplayModifiers({
        isShuffled: false,
        showOnlyStarred: false,
        selectedKeyConcepts: [],
      });
      clearEditSession();
    }
  }, [contentId, setView, setCurrentIndex, setDisplayModifiers]);

  return (
    <Tabs
      value={tab}
      onValueChange={handleChange}
      className="w-full flex flex-col items-center"
    >
      {!hideTabsList && (
        <TabsList className="flex w-fit mb-0 bg-primary/5">
          <TabsTrigger className="flex items-center gap-2" value="active">
            {t("flashcards.activeRecall")}
            <Badge
              variant="outline"
              className="bg-green-500/10 text-green-500 dark:text-[#7DFF97] px-1 rounded-sm border-none font-medium"
            >
              {t("new")}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="fast">{t("flashcards.fastReview")}</TabsTrigger>
        </TabsList>
      )}
      <TabsContent value="active" className="w-full">
        <FlashcardsActive />
      </TabsContent>
      <TabsContent value="fast" className="w-full">
        <Flashcards />
      </TabsContent>
    </Tabs>
  );
}
