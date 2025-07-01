import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLearnStore } from "@/hooks/use-learn";
import { useResizeStore } from "@/hooks/use-resize-store";
import { useTabStore } from "@/hooks/use-tab";
import { ContentType, TabNames, Tier } from "@/lib/types";
import { memo, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BookOpenCheck, ChevronLeft, ChevronRight } from "lucide-react";
import {
  PiArticleBold,
  PiBookOpenBold,
  PiCardsBold,
  PiChatCircleBold,
  PiNoteBold,
} from "react-icons/pi";
import { useMediaQuery } from "usehooks-ts";
import { Button } from "../ui/button";
import Chapters from "./chapters";
import Chats from "./chats";
import FlashcardsTabs from "./flashcards-tabs";
import Notes from "./notes";
import StudyGuide from "./study-guide";
import Summary from "./summary";
import Voice from "./voice";
import { cn, isDocumentType } from "@/lib/utils";
import { isAudioType, isVideoType } from "@/lib/utils";
import { useSourceStore } from "@/hooks/use-source-store";
import { useCurrentSourceStore } from "@/hooks/use-current-source-store";
import { useShallow } from "zustand/react/shallow";

const LearnTabs = ({ type }: { type: ContentType }) => {
  const { t } = useTranslation();
  const { currentTab, setCurrentTab } = useTabStore();
  const {
    isFullTab,
    setIsFullTab,
    isSecondaryPanelOpen,
    setIsSecondaryPanelOpen,
  } = useResizeStore();
  const { isLearnMode } = useLearnStore();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [overflowState, setOverflowState] = useState({
    left: false,
    right: false,
  });
  const tabsRef = useRef<HTMLDivElement>(null);
  const onSource = useSourceStore(useShallow((state) => state.onSource));
  const currentSourceStore = useCurrentSourceStore;
  const currentSource = currentSourceStore.getState().currentSource;

  const handleToggleFullTab = () => {
    setIsFullTab(!isFullTab);
    if (isFullTab && isDocumentType(type)) {
      setTimeout(() => {
        onSource(currentSource as number, null, undefined, "auto");
      }, 1);
    }
  };

  // check if the tabs have overflow and which side
  useEffect(() => {
    const checkOverflow = () => {
      if (tabsRef.current) {
        const { scrollWidth, clientWidth, scrollLeft } = tabsRef.current;
        const hasHorizontalOverflow = scrollWidth > clientWidth;

        if (hasHorizontalOverflow) {
          const maxScroll = scrollWidth - clientWidth;
          setOverflowState({
            left: scrollLeft > 0,
            right: scrollLeft < maxScroll - 1,
          });
        } else {
          setOverflowState({ left: false, right: false });
        }
      }
    };

    checkOverflow();

    // Check on scroll
    tabsRef.current?.addEventListener("scroll", checkOverflow);

    // Check on resize
    const resizeObserver = new ResizeObserver(checkOverflow);
    if (tabsRef.current) {
      resizeObserver.observe(tabsRef.current);
    }

    return () => {
      tabsRef.current?.removeEventListener("scroll", checkOverflow);
      resizeObserver.disconnect();
    };
  }, []);

  // if not mobile and type is stt or youtube and current tab is chapters, set current tab to chat
  useEffect(() => {
    if (!isMobile && isVideoType(type) && currentTab === "chapters") {
      setCurrentTab("chat");
    }
  }, [type, setCurrentTab, currentTab, isMobile]);

  // if type is audio type and isFullTab is true, set isFullTab to false
  // if type is not video type and isSecondaryPanelOpen is false, set isSecondaryPanelOpen to true
  useEffect(() => {
    if (isAudioType(type) && isFullTab) {
      setIsFullTab(false);
    }
    if (!isVideoType(type) && !isSecondaryPanelOpen) {
      setIsSecondaryPanelOpen(true);
    }
  }, [
    type,
    isFullTab,
    setIsFullTab,
    setIsSecondaryPanelOpen,
    isSecondaryPanelOpen,
    isVideoType,
    isAudioType,
  ]);

  // if type is conversation, set to full tab
  useEffect(() => {
    if (type === "conversation") {
      setIsFullTab(true);
    } else {
      setIsFullTab(false);
    }
  }, [type, setIsFullTab]);

  // if type is conversation, and if current tab is chapters or summary, set current tab to chat
  useEffect(() => {
    if (
      type === "conversation" &&
      (currentTab === "chapters" || currentTab === "summary")
    ) {
      setCurrentTab("chat");
    }
  }, [type, currentTab, setCurrentTab]);

  // Content wrapper to apply half-width layout when in full tab mode
  const ContentWrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <div className="w-full h-full">
        <div
          className={cn(
            "h-full",
            isFullTab ? "lg:w-3/5 2xl:w-1/2 mx-auto" : "w-full",
          )}
        >
          {children}
        </div>
      </div>
    );
  };

  return (
    <Tabs
      value={currentTab}
      onValueChange={(value) => {
        setCurrentTab(value as TabNames);
      }}
    >
      <div className="flex flex-row md:space-x-2 lg:mx-2.5 mx-2">
        {type !== "stt" && type !== "conversation" && (
          <Button
            key="toggle-tab-button"
            onClick={handleToggleFullTab}
            variant="ghost"
            size="icon"
            className="md:flex hidden bg-primary/5 text-muted-foreground"
          >
            {isFullTab ? (
              <ChevronRight
                key="expand-icon"
                className="h-4 w-4"
                aria-label={t("learnTabs.toggleFullTabButton.expand")}
              />
            ) : (
              <ChevronLeft
                key="collapse-icon"
                className="h-4 w-4"
                aria-label={t("learnTabs.toggleFullTabButton.collapse")}
              />
            )}
          </Button>
        )}
        <TabsList
          key="tabs-list"
          className="bg-primary/5 w-full max-w-full overflow-x-auto items-center justify-start relative"
          style={
            overflowState.left || overflowState.right
              ? ({
                  ["--mask-fade" as string]: `linear-gradient(to right, ${
                    overflowState.left ? "transparent, black 20%" : "black"
                  }, ${
                    overflowState.right ? "black 80%, transparent" : "black"
                  })`,
                  WebkitMaskImage: "var(--mask-fade)",
                  maskImage: "var(--mask-fade)",
                } as React.CSSProperties)
              : undefined
          }
        >
          <div
            ref={tabsRef}
            className="flex w-full items-center overflow-x-auto scrollbar-hide gap-2"
          >
            {isLearnMode || currentTab === "voice" ? (
              <TabsTrigger
                key="chat-tab"
                className="w-full hover:text-foreground flex items-center gap-2"
                value="voice"
              >
                <PiChatCircleBold className="h-4 w-4" />
                {t("learnTabs.chatTab")}
              </TabsTrigger>
            ) : (
              <TabsTrigger
                key="chat-tab-voice"
                className="w-full hover:text-foreground flex items-center gap-2"
                value="chat"
              >
                <PiChatCircleBold className="h-4 w-4" />
                {t("learnTabs.chatTab")}
              </TabsTrigger>
            )}
            <TabsTrigger
              key="flashcards-tab"
              className="w-full hover:text-foreground flex items-center gap-2"
              value="flashcards"
            >
              <PiCardsBold className="h-4 w-4" />
              {t("learnTabs.flashcardsTab")}
            </TabsTrigger>
            <TabsTrigger
              key="study-guide-tab"
              className="w-full hover:text-foreground flex items-center gap-2"
              value="study-guide"
            >
              <BookOpenCheck className="h-4 w-4" />
              {t("learnTabs.studyGuideTab")}
            </TabsTrigger>
            {type !== "conversation" && (
              <TabsTrigger
                key="summary-tab"
                className="w-full hover:text-foreground flex items-center gap-2"
                value="summary"
              >
                <PiArticleBold className="h-4 w-4" />
                {t("learnTabs.summaryTab")}
              </TabsTrigger>
            )}
            {!isAudioType(type) &&
              !isVideoType(type) &&
              type !== "conversation" && (
                <TabsTrigger
                  key="chapters-tab"
                  className="w-full hover:text-foreground flex items-center gap-2"
                  value="chapters"
                >
                  <PiBookOpenBold className="h-4 w-4" />
                  {t("secondaryTabs.chapters")}
                </TabsTrigger>
              )}
            <TabsTrigger
              key="notes-tab"
              className="w-full hover:text-foreground flex items-center gap-2"
              value="notes"
            >
              <PiNoteBold className="h-4 w-4" />
              {t("learnTabs.notesTab")}
            </TabsTrigger>
          </div>
        </TabsList>
      </div>
      <TabsContent
        key="chat-content"
        value="chat"
        className="sm:px-2 sm:pb-0 pb-2 px-4 mt-4 pt-0"
      >
        <Chats type={type} isFullWidth={isFullTab} />
      </TabsContent>
      <TabsContent key="voice-content" value="voice">
        <ContentWrapper>
          <Voice contentType={type as ContentType} showContent={false} />
        </ContentWrapper>
      </TabsContent>
      <TabsContent
        className="overflow-y-auto px-2 md:h-[calc(100vh-135px)]"
        key="flashcards-content"
        value="flashcards"
      >
        <ContentWrapper>
          <FlashcardsTabs />
        </ContentWrapper>
      </TabsContent>
      <TabsContent key="summary-content" value="summary">
        <Summary key="summary-component" />
      </TabsContent>
      <TabsContent key="notes-content" value="notes">
        <ContentWrapper>
          <Notes />
        </ContentWrapper>
      </TabsContent>
      <TabsContent key="study-guide-content" value="study-guide">
        <ContentWrapper>
          <StudyGuide />
        </ContentWrapper>
      </TabsContent>
      {!isAudioType(type) && !isVideoType(type) && (
        <TabsContent
          className="overflow-y-auto px-2 md:h-[calc(100vh-135px)]"
          key="chapters-content"
          value="chapters"
        >
          <ContentWrapper>
            <Chapters type={type} />
          </ContentWrapper>
        </TabsContent>
      )}
    </Tabs>
  );
};

export default memo(LearnTabs);
