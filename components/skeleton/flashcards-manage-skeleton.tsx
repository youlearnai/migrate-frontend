import { Skeleton } from "@/components/ui/skeleton";

const FlashcardsManageSkeleton = () => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center space-x-2 mb-6">
        <Skeleton className="h-10 w-24" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto md:mb-8 relative">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="mb-4">
            <Skeleton className="h-[300px] w-full rounded-lg" />
          </div>
        ))}

        <Skeleton className="h-10 w-full mt-4" />
      </div>
    </div>
  );
};

const FlashcardsMenuSkeleton = () => {
  return (
    <div className="w-full">
      {/* Celebration icon area */}
      <div className="my-6 flex justify-center">
        <Skeleton className="h-20 w-20 rounded-full" />
      </div>

      {/* Main content area */}
      <div className="space-y-4 mb-8">
        <Skeleton className="w-full h-16 rounded-xl" />
        <Skeleton className="w-full h-16 rounded-xl" />
        <Skeleton className="w-full h-32 rounded-xl" />
      </div>

      {/* Bottom actions */}
      <div className="flex justify-center">
        <Skeleton className="w-48 h-10 rounded-2xl" />
      </div>
    </div>
  );
};

export default FlashcardsManageSkeleton;
export { FlashcardsMenuSkeleton };
