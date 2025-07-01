"use client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useResizeStore } from "@/hooks/use-resize-store";
import { useCallback } from "react";
import Spinner from "../global/spinner";

const LearnContentSkeleton = () => (
  <Skeleton className="w-full aspect-video rounded-lg" />
);

const SecondaryTabsSkeleton = () => (
  <div className="flex-grow overflow-hidden">
    <div className="space-y-4 mt-4">
      <div className="flex space-x-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  </div>
);

const LearnTabsSkeleton = () => (
  <div className="space-y-4">
    <div className="flex space-x-2">
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-10 w-32" />
    </div>
    <div className="space-y-3">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  </div>
);

const MobileTabsSkeleton = () => (
  <div className="flex flex-col space-y-4">
    <div className="space-y-3">
      <div className="flex space-x-2">
        <Skeleton className="h-10 flex-1" />
      </div>
      <div className="flex space-x-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  </div>
);

export {
  LearnContentSkeleton,
  SecondaryTabsSkeleton,
  LearnTabsSkeleton,
  MobileTabsSkeleton,
};

const LearnSkeleton = () => {
  const { panelSize, setPanelSize } = useResizeStore();

  const handlePanelResize = useCallback(
    (sizes: number[]) => {
      setPanelSize(sizes[0]);
    },
    [setPanelSize],
  );

  return (
    <>
      {/* <div className="hidden h-[calc(100vh-65px)] w-full md:block">
        <ResizablePanelGroup
          direction="horizontal"
          className="flex h-full"
          onLayout={handlePanelResize}
        >
          <div className="flex flex-row w-full p-2 h-full">
            <ResizablePanel
              className="flex flex-col space-y-2 px-4"
              minSize={30}
              defaultSize={panelSize}
            >
              <LearnContentSkeleton />
              <SecondaryTabsSkeleton />
            </ResizablePanel>
            <ResizableHandle withHandle className="mx-1" />
            <ResizablePanel minSize={30} className="w-full px-4">
              <LearnTabsSkeleton />
            </ResizablePanel>
          </div>
        </ResizablePanelGroup>
      </div>
      <div className="md:hidden p-4">
        <MobileTabsSkeleton />
      </div> */}
      <div className="flex items-center justify-center h-full">
        <Spinner />
      </div>
    </>
  );
};

export default LearnSkeleton;
