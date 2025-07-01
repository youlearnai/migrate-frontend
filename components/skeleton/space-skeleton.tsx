"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { useContentViewStore } from "@/hooks/use-content-view-store";
import ContentCardSkeleton from "./content-card-skeleton";

const SpaceNameSkeleton = () => (
  <div className="text-lg md:text-2xl lg:text-3xl flex flex-row items-center group w-full md:mb-4">
    <Skeleton className="h-8 w-1/3" />
  </div>
);

const SpaceDescriptionSkeleton = () => (
  <div className="w-full flex md:mt-0 mt-3">
    <Skeleton className="h-20 w-[95%]" />
  </div>
);

const SpaceActionsSkeleton = () => (
  <div className="hidden md:flex flex-row my-6 md:my-0 space-x-2 items-center">
    <Skeleton className="h-10 w-24" />
  </div>
);

const SpaceStatsSkeleton = () => (
  <div className="text-right mt-0 text-sm w-full md:mt-2 lg:mt-6 mb-2">
    <Skeleton className="h-4 w-16 ml-auto" />
  </div>
);

const SpaceHeaderSkeleton = () => {
  return (
    <div className="w-full mt-10 sm:px-10 lg:px-24">
      <div className="flex flex-col md:flex-row md:space-x-4 justify-between">
        <div className="flex flex-col w-full">
          <SpaceNameSkeleton />
          <SpaceDescriptionSkeleton />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-row gap-2">
            <SpaceActionsSkeleton />
            <SpaceActionsSkeleton />
            <SpaceActionsSkeleton />
          </div>
          <div className="flex justify-end">
            <SpaceActionsSkeleton />
          </div>
        </div>
      </div>
      <SpaceStatsSkeleton />
      <div className="border-b" />
    </div>
  );
};

const SpaceBoardSkeleton = () => {
  const { contentView } = useContentViewStore();
  return (
    <div className="flex flex-col w-full items-center md:px-24 justify-center">
      {contentView === "grid" ? (
        <div
          className={`w-full items-center justify-center mx-10 mb-10 lg:mx-28 mt-6 grid gap-4 sm:gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 min-[1920px]:grid-cols-6`}
        >
          {Array.from({ length: 5 }).map((_, index) => (
            <ContentCardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <div className="w-full mt-2 h-full">
          {Array.from({ length: 4 }).map((_, index) => (
            <ContentCardSkeleton key={index} />
          ))}
        </div>
      )}
    </div>
  );
};

const BoardPaginationSkeleton = () => (
  <div className="h-10 w-full max-w-sm animate-pulse bg-muted rounded-lg" />
);

export {
  BoardPaginationSkeleton,
  SpaceActionsSkeleton,
  SpaceBoardSkeleton,
  SpaceDescriptionSkeleton,
  SpaceHeaderSkeleton,
  SpaceNameSkeleton,
  SpaceStatsSkeleton,
};

const SpaceSkeleton = () => {
  return (
    <div className="flex flex-col w-full">
      <SpaceHeaderSkeleton />
      <SpaceBoardSkeleton />
    </div>
  );
};

export default SpaceSkeleton;
