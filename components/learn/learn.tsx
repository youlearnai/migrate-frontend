"use client";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useCaptureStore } from "@/hooks/use-capture-store";
import { useResizeStore } from "@/hooks/use-resize-store";
import { useGetContent } from "@/query-hooks/content";
import { useParams } from "next/navigation";
import React, { Suspense, lazy } from "react";
import { useScrollLock } from "usehooks-ts";
import {
  LearnContentSkeleton,
  LearnTabsSkeleton,
  MobileTabsSkeleton,
  SecondaryTabsSkeleton,
} from "../skeleton/learn-skeleton";
import { cn } from "@/lib/utils";
import { isAudioType, isVideoType } from "@/lib/utils";
import LearnContent from "./learn-content";

const SecondaryTabs = lazy(() => import("./secondary-tab"));
const LearnTabs = lazy(() => import("./learn-tabs"));
const MobileTabs = lazy(() => import("./learn-mobile-tabs"));

const Learn = () => {
  const { isFullTab, panelSize, setPanelSize, isSecondaryPanelOpen } =
    useResizeStore();
  const params = useParams();
  const { isDragging } = useCaptureStore();
  const { data: content } = useGetContent(
    params.spaceId as string | undefined,
    params.contentId as string,
    undefined,
    true,
  );
  useScrollLock({
    autoLock: isDragging,
  });

  const handlePanelResize = React.useCallback(
    (sizes: number[]) => {
      setPanelSize(sizes[0]);
    },
    [setPanelSize],
  );

  const contentType = content?.type || "youtube";
  const [showContent, setShowContent] = React.useState(true);

  return (
    <>
      <div key="desktop-view" className="hidden h-full w-full md:block">
        <ResizablePanelGroup
          key="panel-group"
          direction="horizontal"
          className="flex flex-col h-full"
          onLayout={handlePanelResize}
        >
          <div className="flex flex-row w-full px-2 py-2 h-full">
            <ResizablePanel
              key="content-panel"
              className={cn(
                "flex flex-col space-y-2 px-4 h-full",
                isFullTab ? "hidden" : "flex",
              )}
              minSize={30}
              defaultSize={panelSize}
            >
              <div className={isSecondaryPanelOpen ? "block" : "hidden"}>
                <Suspense
                  key="content-suspense"
                  fallback={<LearnContentSkeleton />}
                >
                  <LearnContent key="learn-content" />
                </Suspense>
              </div>
              <div className="flex-grow overflow-hidden">
                {(isVideoType(contentType) || isAudioType(contentType)) && (
                  <Suspense
                    key="secondary-suspense"
                    fallback={<SecondaryTabsSkeleton />}
                  >
                    <SecondaryTabs key="secondary-tabs" type={contentType} />
                  </Suspense>
                )}
              </div>
            </ResizablePanel>
            <ResizableHandle
              key="resize-handle"
              withHandle
              className={cn("mx-1", isFullTab ? "hidden" : "flex")}
            />
            <ResizablePanel key="tabs-panel" minSize={30} className="w-full">
              <Suspense key="tabs-suspense" fallback={<LearnTabsSkeleton />}>
                <LearnTabs key="learn-tabs" type={contentType} />
              </Suspense>
            </ResizablePanel>
          </div>
        </ResizablePanelGroup>
      </div>
      <div key="mobile-view" className="md:hidden">
        <div className="flex flex-col">
          <div
            key="mobile-content"
            className={showContent ? "block" : "hidden"}
          >
            <Suspense
              key="mobile-content-suspense"
              fallback={<LearnContentSkeleton />}
            >
              <LearnContent key="mobile-learn-content" />
            </Suspense>
          </div>
          <Suspense
            key="mobile-tabs-suspense"
            fallback={<MobileTabsSkeleton />}
          >
            <MobileTabs
              key="mobile-tabs"
              type={contentType}
              showContent={showContent}
              setShowContent={setShowContent}
            />
          </Suspense>
        </div>
      </div>
    </>
  );
};

export default React.memo(Learn);
