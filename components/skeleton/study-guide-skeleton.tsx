import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const StudyGuideLoadingSkeleton = () => {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-24 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
};

export const ConceptCardSkeleton = () => {
  return (
    <div className="w-full p-4 border border-border rounded-lg bg-card flex flex-col gap-4 animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <div className="h-3 w-16 bg-muted rounded" />
          <div className="h-5 w-48 bg-muted rounded mt-2" />
        </div>
        <div className="h-5 w-5 bg-muted rounded-full" />
      </div>

      <div className="mt-auto">
        <div className="relative">
          <div className="w-full rounded-full bg-muted h-2" />
        </div>
      </div>
    </div>
  );
};

export const StudyGuideConceptProgressSkeleton = () => {
  return (
    <div className="w-full">
      <div className="grid gap-4 grid-cols-1">
        {Array(5)
          .fill(0)
          .map((_, index) => (
            <ConceptCardSkeleton key={index} />
          ))}
      </div>
    </div>
  );
};

export const MCQExplanationSkeleton = () => {
  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-5 w-24" />
      </div>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-2" />
    </>
  );
};

export const FRQExplanationSkeleton = () => {
  return (
    <>
      <div className="mb-4">
        <Skeleton className="h-5 w-24 mb-2" />
        <Skeleton className="h-5 w-24 mb-2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4 mt-2" />
      </div>
      <div>
        <Skeleton className="h-5 w-32 mb-2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full mt-2" />
        <Skeleton className="h-4 w-1/2 mt-2" />
      </div>
    </>
  );
};

export const TFExplanationSkeleton = () => {
  return (
    <div className="mb-4">
      <Skeleton className="h-5 w-24 mb-2" />
      <Skeleton className="h-5 w-24 mb-2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4 mt-2" />
    </div>
  );
};

export const FIBExplanationSkeleton = () => {
  return (
    <div className="mb-4">
      <Skeleton className="h-5 w-24 mb-2" />
      <Skeleton className="h-5 w-24 mb-2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4 mt-2" />
    </div>
  );
};
