import { Skeleton } from "@/components/ui/skeleton";
import { useContentViewStore } from "@/hooks/use-content-view-store";

const ContentCardSkeleton = () => {
  const { contentView } = useContentViewStore();

  if (contentView === "list") {
    return (
      <div className="flex flex-row items-center justify-between w-full h-full gap-4 mt-2">
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 flex flex-col border rounded-2xl w-full">
      {/* Thumbnail skeleton */}
      <Skeleton className="aspect-video rounded-t-2xl border-b flex-shrink-0" />

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
  );
};

export default ContentCardSkeleton;
