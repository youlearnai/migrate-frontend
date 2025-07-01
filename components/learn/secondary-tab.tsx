"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMicStore } from "@/hooks/use-mic-store";
import { ContentType, Transcript } from "@/lib/types";
import { useGetTranscript } from "@/query-hooks/content";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Chapters from "./chapters";
import Transcripts from "./transcripts";
import {
  PiBookOpenBold,
  PiCaretDownBold,
  PiCaretLineLeftBold,
  PiCaretLineRightBold,
  PiCaretUpBold,
  PiTextTBold,
} from "react-icons/pi";
import { Button } from "../ui/button";
import { useResizeStore } from "@/hooks/use-resize-store";
import { useSearchHighlightStore } from "@/hooks/use-search-highlight-store";
import { isAudioType, isVideoType } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SecondaryTabs = ({ type }: { type: ContentType }) => {
  const { t } = useTranslation();
  const params = useParams();
  const { data, error, isError } = useGetTranscript(
    params.contentId as string,
    {
      enabled: isVideoType(type) || isAudioType(type),
    },
  );
  const [currentTab, setCurrentTab] = useState<"chapters" | "transcripts">(
    "chapters",
  );
  const { isRecording, transcript } = useMicStore();
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const { isSecondaryPanelOpen, setIsSecondaryPanelOpen } = useResizeStore();
  const { resetSearch, clearComponentMatches } = useSearchHighlightStore();

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

  const handleTabChange = (value: string) => {
    clearComponentMatches();
    setCurrentTab(value as "chapters" | "transcripts");
  };

  return (
    <Tabs
      value={currentTab}
      onValueChange={handleTabChange}
      className="relative mr-auto w-full h-full flex flex-col"
    >
      <div className="flex flex-row mt-3 items-center flex-wrap gap-2 justify-between">
        <div className="flex flex-row gap-2 flex-wrap items-center">
          <TabsList
            key="secondary-tabs-list"
            className="md:w-64 lg:w-64 bg-primary/5 dark:bg-primary/10"
          >
            <TabsTrigger
              key="chapters-trigger"
              value="chapters"
              className="w-full md:w-64 lg:w-64 flex items-center gap-2"
            >
              <PiBookOpenBold className="h-4 w-4" role="img" />
              {t("secondaryTabs.chapters")}
            </TabsTrigger>
            {(isVideoType(type) || isAudioType(type)) && (
              <TabsTrigger
                key="transcripts-trigger"
                value="transcripts"
                className="w-full md:w-64 lg:w-64 flex items-center gap-2"
              >
                <PiTextTBold className="h-4 w-4" role="img" />
                {t("secondaryTabs.transcripts")}
              </TabsTrigger>
            )}
          </TabsList>
          {isVideoType(type) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSecondaryPanelOpen(!isSecondaryPanelOpen)}
              className="md:flex hidden bg-primary/5 hover:bg-primary/10 dark:bg-primary/10 text-muted-foreground"
            >
              {isSecondaryPanelOpen ? (
                <ChevronLeft className="h-4 w-4 rotate-90" role="img" />
              ) : (
                <ChevronRight className="h-4 w-4 rotate-90" role="img" />
              )}
            </Button>
          )}
        </div>
      </div>
      <TabsContent
        key="chapters-content"
        className="p-0 h-[50vh] flex-grow overflow-y-auto"
        value="chapters"
      >
        <Chapters key="chapters-component" type={type} />
      </TabsContent>
      <TabsContent
        key="transcripts-content"
        className="p-0 flex-grow overflow-y-auto sidebar-scroll"
        value="transcripts"
      >
        <Transcripts
          key="transcripts-component"
          data={isRecording ? transcripts : data}
          isError={isError}
          error={error}
          type={type}
        />
      </TabsContent>
    </Tabs>
  );
};

export default SecondaryTabs;
