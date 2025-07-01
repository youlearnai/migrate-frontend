import { memo } from "react";
import { Skeleton } from "../ui/skeleton";

const LinesSkeleton = memo(({ times = 3 }: { times?: number }) => {
  return (
    <div className="flex flex-col gap-4 mt-8">
      {Array.from({ length: times }).map((_, groupIndex) => (
        <div key={groupIndex} className="flex flex-col gap-2">
          {/* Heading */}
          <Skeleton className="h-10 w-3/4" />

          {/* Description lines */}
          {Array.from({ length: 3 + (Math.random() > 0.5 ? 1 : 0) }).map(
            (_, lineIndex) => (
              <Skeleton
                key={lineIndex}
                className="h-6"
                style={{
                  width: lineIndex < 2 ? "100%" : `${Math.random() * 20 + 70}%`,
                }}
              />
            ),
          )}
        </div>
      ))}
    </div>
  );
});

export default LinesSkeleton;
