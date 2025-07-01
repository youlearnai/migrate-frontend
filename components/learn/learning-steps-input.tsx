import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type LearningStepsInputProps = {
  value: number[]; // Array of seconds
  onChange: (value: number[]) => void;
  onAddStep?: () => void;
  className?: string;
};

export function LearningStepsInput({
  value,
  onChange,
  onAddStep,
  className,
}: LearningStepsInputProps) {
  const formatTime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0) parts.push(`${secs}s`);

    return parts.join(" ") || "0s";
  };

  const handleRemoveStep = (index: number) => {
    const newValue = value.filter((_, i) => i !== index);
    onChange(newValue);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="space-y-2">
        {value.map((seconds, index) => (
          <div
            key={index}
            className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2"
          >
            <span className="text-sm font-medium">
              Review {index + 1}: {formatTime(seconds)}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => handleRemoveStep(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
