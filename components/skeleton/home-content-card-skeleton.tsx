import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

const HomeContentCardSkeleton = () => {
  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 flex flex-col border rounded-2xl max-w-[16rem] 2xl:max-w-[18rem] w-full flex-shrink-0 h-full">
      <div className="flex-grow flex flex-col">
        {/* Thumbnail skeleton */}
        <Skeleton className="aspect-video rounded-t-2xl rounded-b-none border-b flex-shrink-0" />

        {/* Content area skeleton with icon and text */}
        <div className="w-full my-2.5 flex gap-2 px-3 py-1 items-center">
          {/* Icon skeleton */}
          <Skeleton className="w-4 h-4 flex-shrink-0 mr-1 rounded-full" />

          {/* Title and timestamp skeleton */}
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <Skeleton className="w-3/4 h-4 rounded" />
            <Skeleton className="w-1/2 h-3 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeContentCardSkeleton;
