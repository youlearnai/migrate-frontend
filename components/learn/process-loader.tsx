import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";

export interface ProcessPhase {
  id: string;
  label: string;
  status: "completed" | "in-progress" | "pending";
}

interface ProcessLoaderProps {
  phases: ProcessPhase[];
  className?: string;
}

// Animated dots component with repeating cycle: . -> .. -> ... -> .
const AnimatedEllipsis = () => {
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => {
        // Cycle through 1, 2, 3 dots
        // If current count is 3, reset to 1, otherwise increment
        return prev >= 3 ? 1 : prev + 1;
      });
    }, 300); // Update every 0.5 seconds (adjust as needed)

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []); // Empty dependency array means this effect runs once on mount

  return (
    <span className="inline-flex min-w-[24px] text-left">
      {".".repeat(dotCount)}
    </span>
  );
};

const ProcessLoader = ({ phases, className }: ProcessLoaderProps) => {
  return (
    <div className={cn("w-full max-w-md mx-auto py-8", className)}>
      <div className="space-y-4">
        {phases.map((phase) => (
          <div key={phase.id} className="flex items-center gap-3">
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full",
                phase.status === "completed"
                  ? "bg-green-500 text-white"
                  : phase.status === "in-progress"
                    ? "border-green-500 bg-green-100/80 dark:bg-green-950/30"
                    : "border-neutral-300 dark:border-neutral-700",
              )}
            >
              {phase.status === "completed" ? (
                <Check className="h-5 w-5" />
              ) : phase.status === "in-progress" ? (
                <Loader2 className="h-5 w-5 text-green-500 animate-spin" />
              ) : (
                <div className="h-5 w-5" />
              )}
            </div>
            <div className="flex-1 flex items-center">
              <span
                className={cn(
                  "text-base",
                  phase.status === "completed"
                    ? "text-primary/60"
                    : phase.status === "in-progress"
                      ? "text-primary font-medium"
                      : "text-neutral-500 dark:text-neutral-400",
                )}
              >
                {phase.label}
                {phase.status === "in-progress" && <AnimatedEllipsis />}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProcessLoader;
