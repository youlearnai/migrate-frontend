import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLearnStore } from "@/hooks/use-learn";
import { useTabStore } from "@/hooks/use-tab";
import {
  ContentType,
  MobileTabsProps,
  TabNames,
  Transcript,
} from "@/lib/types";
import { useGetTranscript } from "@/query-hooks/content";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  BookOpenCheck,
  PanelBottomOpen,
  PanelTopOpen,
  ChevronDown,
} from "lucide-react";
import {
  PiArticleBold,
  PiBookOpenBold,
  PiCardsBold,
  PiChatCircleBold,
  PiNoteBold,
  PiTextTBold,
  PiEyeBold,
  PiEyeClosedBold,
} from "react-icons/pi";
import { useLocalStorage } from "usehooks-ts";
import Chapters from "./chapters";
import Chats from "./chats";
import Notes from "./notes";
import StudyGuide from "./study-guide";
import Summary from "./summary";
import Transcripts from "./transcripts";
import Voice from "./voice";
import { useEffect, useRef, useState } from "react";
import { isAudioType, isVideoType } from "@/lib/utils";
import SecondaryTabSearch from "./secondary-tab-search";
import { IconType } from "react-icons";
import { LucideIcon } from "lucide-react";
import FlashcardsTabs from "./flashcards-tabs";
import { useMicStore } from "@/hooks/use-mic-store";

// Type for icon that can be either react-icons or lucide-react icons
type IconComponent = IconType | LucideIcon;

const MobileTabs = ({ type, showContent, setShowContent }: MobileTabsProps) => {
  const { t } = useTranslation();
  const params = useParams();
  const { currentTab, setCurrentTab } = useTabStore();
  const { isLearnMode } = useLearnStore();
  const [hasVisitedStudyGuide, setHasVisitedStudyGuide] = useLocalStorage(
    "hasVisitedStudyGuideV2.5",
    false,
  );
  const [overflowState, setOverflowState] = useState({
    left: false,
    right: false,
  });
  const tabsRef = useRef<HTMLDivElement>(null);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const { isRecording, transcript } = useMicStore();

  useEffect(() => {
    if (transcript) {
      setTranscripts((prevTranscripts) => [...prevTranscripts, transcript]);
    }
  }, [transcript]);

  useEffect(() => {
    if (!isRecording) {
      setTranscripts([]);
    }
  }, [isRecording]);

  // Ensure audio and stt content is always shown initially
  useEffect(() => {
    if (
      setShowContent &&
      type !== "conversation" &&
      type !== "stt" &&
      type !== "audio"
    ) {
      setShowContent(false);
    } else if (setShowContent && (type === "stt" || type === "audio")) {
      setShowContent(true);
    }
  }, [type, setShowContent]);

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
  }, [currentTab]);

  const {
    data: transcriptData,
    error,
    isError,
  } = useGetTranscript(params.contentId as string, {
    enabled: isVideoType(type) || isAudioType(type),
  });

  const handleStudyGuideClick = () => {
    if (!hasVisitedStudyGuide) {
      setHasVisitedStudyGuide(true);
    }
    handleTabChange("study-guide");
  };

  const primaryTabs = [
    isLearnMode || currentTab === "voice"
      ? {
          value: "voice",
          label: t("learnTabs.chatTab"),
          icon: PiChatCircleBold as IconComponent,
        }
      : {
          value: "chat",
          label: t("learnTabs.chatTab"),
          icon: PiChatCircleBold as IconComponent,
        },
    ...(type !== "conversation"
      ? [
          {
            value: "summary",
            label: t("learnTabs.summaryTab"),
            icon: PiArticleBold as IconComponent,
          },
        ]
      : []),
    {
      value: "flashcards",
      label: t("learnTabs.flashcardsTab"),
      icon: PiCardsBold as IconComponent,
    },
    ...(type === "conversation"
      ? [
          {
            value: "study-guide",
            label: t("learnTabs.studyGuideTab"),
            icon: BookOpenCheck as IconComponent,
            onClick: handleStudyGuideClick,
            showIndicator: !hasVisitedStudyGuide,
          },
          {
            value: "notes",
            label: t("learnTabs.notesTab"),
            icon: PiNoteBold as IconComponent,
          },
        ]
      : []),
  ];

  const secondaryTabs = [
    ...(type !== "conversation"
      ? [
          {
            value: "chapters",
            label: t("secondaryTabs.chapters"),
            icon: PiBookOpenBold as IconComponent,
          },
        ]
      : []),
    ...(type !== "conversation"
      ? [
          {
            value: "study-guide",
            label: t("learnTabs.studyGuideTab"),
            icon: BookOpenCheck as IconComponent,
            onClick: handleStudyGuideClick,
            showIndicator: !hasVisitedStudyGuide,
          },
        ]
      : []),
    ...(type !== "conversation"
      ? [
          {
            value: "notes",
            label: t("learnTabs.notesTab"),
            icon: PiNoteBold as IconComponent,
          },
        ]
      : []),
    ...((isVideoType(type) || isAudioType(type)) && type !== "conversation"
      ? [
          {
            value: "transcripts",
            label: t("secondaryTabs.transcripts"),
            icon: PiTextTBold as IconComponent,
          },
        ]
      : []),
  ];

  const isSecondaryTabSelected = secondaryTabs.some(
    (tab) => tab.value === currentTab,
  );

  const getContentHeight = (type: ContentType, showContent: boolean) => {
    if (!type) return "h-[calc(100dvh-370px)]";

    if (!showContent) return "h-[calc(100dvh-150px)]";

    if (type === "conversation") return "h-[calc(100dvh-120px)]";

    switch (type) {
      case "youtube":
      case "video":
        return "h-[calc(100dvh-400px)] sm:h-[calc(100dvh-590px)]";
      case "pdf":
      case "pptx":
      case "webpage":
      case "docx":
      case "text":
      case "arxiv":
        return "h-[calc(100dvh-300px)] sm:h-[calc(100dvh-860px)]";
      case "stt":
      case "audio":
        return "h-[calc(100dvh-280px)] sm:h-[calc(100dvh-100px)]";
      default:
        return "h-[calc(100dvh-370px)]";
    }
  };

  const getContentLabel = (type: ContentType) => {
    if (isVideoType(type)) return t("contentTypes.video");

    if (type === "pdf") return t("contentTypes.pdf");
    if (type === "pptx") return t("contentTypes.presentation");
    if (type === "docx") return t("contentTypes.document");
    if (type === "webpage") return t("contentTypes.webpage");
    if (type === "arxiv") return t("contentTypes.paper");
    if (type === "text") return t("contentTypes.text");

    return t("contentTypes.content");
  };

  const handleTabChange = (value: string) => {
    setCurrentTab(value as TabNames);

    // Check if the selected tab is from secondary tabs (dropdown)
    const isFromDropdown = secondaryTabs.some((tab) => tab.value === value);

    // Allow the DOM to update before checking overflow and scrolling
    setTimeout(() => {
      if (tabsRef.current) {
        const { scrollWidth, clientWidth } = tabsRef.current;
        const hasHorizontalOverflow = scrollWidth > clientWidth;

        // If selected from dropdown, scroll to the rightmost position
        if (isFromDropdown && hasHorizontalOverflow) {
          const maxScroll = scrollWidth - clientWidth;
          tabsRef.current.scrollLeft = maxScroll;
        }

        // After scrolling, get the current scroll position and update overflow state
        // (need to get scrollLeft after the scroll operation)
        const currentScrollLeft = tabsRef.current.scrollLeft;

        if (hasHorizontalOverflow) {
          const maxScroll = scrollWidth - clientWidth;
          // Add a small threshold (1px) to account for floating point precision
          setOverflowState({
            left: currentScrollLeft > 0,
            right: currentScrollLeft < maxScroll - 1,
          });
        } else {
          setOverflowState({ left: false, right: false });
        }
      }
    }, 0);
  };

  // Helper function to render icons safely
  const renderIcon = (Icon: IconComponent) => {
    if (!Icon) return null;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <Tabs
      value={currentTab}
      onValueChange={handleTabChange}
      className="flex flex-col overflow-hidden"
    >
      {type !== "conversation" && type !== "stt" && type !== "audio" && (
        <div className="flex justify-center mb-2">
          <Button
            onClick={() => setShowContent(!showContent)}
            variant="outline"
            size="sm"
            className="w-full mx-1 flex items-center justify-center gap-2 shadow-sm"
          >
            {showContent ? (
              <>
                <PanelTopOpen className="h-4 w-4" />
                {t("actions.hide")} {getContentLabel(type)}
              </>
            ) : (
              <>
                <PanelBottomOpen className="h-4 w-4" />
                {t("actions.show")} {getContentLabel(type)}
              </>
            )}
          </Button>
        </div>
      )}
      <div className="flex flex-row space-x-1 mx-1 top-0 bg-background z-10">
        <TabsList
          key="mobile-tabs-list"
          className="w-full bg-primary/5 dark:bg-primary/10 overflow-x-auto max-w-full"
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
            className={`flex w-full items-center ${
              !overflowState.left && !overflowState.right
                ? "justify-center"
                : "justify-start"
            } overflow-x-auto scrollbar-hide`}
          >
            {primaryTabs.map((tab) => (
              <TabsTrigger
                key={`mobile-${tab.value}-tab`}
                className="flex-shrink-0 text-xs flex items-center justify-center gap-2 data-[state=active]:bg-background dark:data-[state=active]:bg-background px-3"
                value={tab.value}
                onClick={tab.onClick}
              >
                {renderIcon(tab.icon)}
                {tab.label}
                {/* {tab.showIndicator && (
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                )} */}
              </TabsTrigger>
            ))}
            {type !== "conversation" && (
              <DropdownMenu key="dropdown-menu">
                <DropdownMenuTrigger key="dropdown-trigger" asChild>
                  <Button
                    variant="ghost"
                    className={`flex-shrink-0 text-xs h-8 px-3 flex items-center justify-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground ${
                      isSecondaryTabSelected
                        ? "bg-background text-foreground"
                        : ""
                    }`}
                  >
                    {isSecondaryTabSelected ? (
                      <div className="flex items-center justify-center gap-2">
                        {(() => {
                          const selectedTab = secondaryTabs.find(
                            (tab) => tab.value === currentTab,
                          );
                          return (
                            <>
                              {selectedTab?.icon &&
                                renderIcon(selectedTab.icon)}
                              <span>{selectedTab?.label}</span>
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <span>{t("tabs.showMore")}</span>
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent key="dropdown-content">
                  {secondaryTabs.map((tab) => (
                    <DropdownMenuItem
                      key={`dropdown-${tab.value}`}
                      onClick={() => handleTabChange(tab.value)}
                      className="flex items-center gap-2 px-2 justify-start"
                    >
                      {renderIcon(tab.icon)}
                      <span className="flex-1">{tab.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </TabsList>
      </div>
      <div className="flex-1 overflow-hidden mt-2 mx-[-16]">
        {currentTab === ("transcripts" as TabNames) && <SecondaryTabSearch />}
        <TabsContent
          key="mobile-chat-content"
          value="chat"
          className={`flex-1 m-0 ${getContentHeight(type, showContent)}`}
        >
          <Chats type={type} />
        </TabsContent>
        <TabsContent
          value="voice"
          className={`flex-1 m-0 ${getContentHeight(type, showContent)}`}
        >
          <Voice contentType={type} showContent={showContent} />
        </TabsContent>
        <TabsContent
          key="mobile-flashcards-content"
          value="flashcards"
          className={`flex-1 m-0 mx-4 overflow-y-auto ${getContentHeight(type, showContent)}`}
        >
          <FlashcardsTabs />
        </TabsContent>
        <TabsContent
          key="mobile-summary-content"
          value="summary"
          className={`flex-1 m-0 ${getContentHeight(type, showContent)}`}
        >
          <Summary key="mobile-summary-component" />
        </TabsContent>
        <TabsContent
          key="mobile-chapters-content"
          value="chapters"
          className={`flex-1 m-0 ${getContentHeight(type, showContent)}`}
        >
          <Chapters type={type} />
        </TabsContent>
        <TabsContent
          key="mobile-transcripts-content"
          value="transcripts"
          className={`flex-1 m-0 ${getContentHeight(type, showContent)}`}
        >
          <Transcripts
            key="mobile-transcripts"
            data={isRecording ? transcripts : transcriptData}
            isError={isError}
            error={error}
            type={type}
          />
        </TabsContent>
        <TabsContent
          key="mobile-notes-content"
          value="notes"
          className={`flex-1 m-0 ${getContentHeight(type, showContent)}`}
        >
          <Notes />
        </TabsContent>
        <TabsContent
          key="mobile-study-guide-content"
          value="study-guide"
          className={`flex-1 m-0 ${getContentHeight(type, showContent)}`}
        >
          <StudyGuide />
        </TabsContent>
      </div>
    </Tabs>
  );
};

export default MobileTabs;
