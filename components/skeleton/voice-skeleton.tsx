import { Skeleton } from "@/components/ui/skeleton";

const VoiceSkeleton = ({ mini }: { mini?: boolean }) => {
  if (mini) {
    return (
      <div className="flex-1 flex items-center min-w-0">
        <div className="flex-1 min-w-0 flex gap-2 mr-3">
          <div className="flex items-center justify-center gap-2 pointer-events-none z-0 transition-opacity duration-150 ease-in-out opacity-10">
            <div className="w-4 h-4 rounded-full bg-current animate-[scale_2s_ease-in-out_infinite]" />
            <div className="w-4 h-4 rounded-full bg-current animate-[scale_2s_ease-in-out_0.5s_infinite]" />
            <div className="w-4 h-4 rounded-full bg-current animate-[scale_2s_ease-in-out_1s_infinite]" />
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center flex-col w-full max-w-2xl mx-auto px-4 mb-4">
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: window.innerWidth >= 640 ? "20%" : "25%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <Skeleton className="w-[300px]" />
        <div className="flex items-center justify-center gap-8 pointer-events-none z-0 transition-opacity duration-150 ease-in-out opacity-10">
          <div className="w-8 h-8 rounded-full bg-current animate-[scale_2s_ease-in-out_infinite]" />
          <div className="w-8 h-8 rounded-full bg-current animate-[scale_2s_ease-in-out_0.5s_infinite]" />
          <div className="w-8 h-8 rounded-full bg-current animate-[scale_2s_ease-in-out_1s_infinite]" />
        </div>
      </div>
    </div>
  );
};

export const AdvancedVoiceSkeleton = () => {
  return (
    <div className="h-[82px] flex w-full justify-between mt-4 px-4 border overflow-y-auto rounded-2xl">
      <div className="flex-1 min-w-0 flex gap-2 mr-3">
        <div className="flex items-center justify-center gap-3 pointer-events-none z-0 transition-opacity duration-150 ease-in-out opacity-10">
          <div className="w-3 h-6 rounded-full bg-current" />
          <div className="w-3 h-6 rounded-full bg-current" />
          <div className="w-3 h-6 rounded-full bg-current" />
        </div>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="flex items-center justify-center gap-3 pointer-events-none z-0 transition-opacity duration-150 ease-in-out opacity-10">
          <div className="w-3 h-6 rounded-full bg-current" />
          <div className="w-3 h-6 rounded-full bg-current" />
          <div className="w-3 h-6 rounded-full bg-current" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default VoiceSkeleton;
