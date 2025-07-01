import { Skeleton } from "@/components/ui/skeleton";

export function PersonalizedFormSkeleton() {
  return (
    <div className="space-y-6">
      {/* Field 1 Skeleton */}
      <div className="space-y-2">
        <Skeleton className="w-1/4 h-4" />
        <Skeleton className="w-full h-10" />
      </div>

      {/* Field 2 Skeleton */}
      <div className="space-y-2">
        <Skeleton className="w-1/3 h-4" />
        <Skeleton className="w-full h-10" />
      </div>

      {/* Field 3 Skeleton */}
      <div className="space-y-2">
        <Skeleton className="w-1/3 h-4" />
        <Skeleton className="w-full h-10" />
      </div>

      {/* Button Skeleton */}
      <Skeleton className="w-full h-10" />
    </div>
  );
}
