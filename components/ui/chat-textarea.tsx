import React, { forwardRef } from "react";
import { Textarea, TextareaProps } from "../ui/textarea";
import { cn } from "@/lib/utils";

type ChatTextareaProps = TextareaProps & {
  variant?: "bordered" | "default";
};

const ChatTextarea = forwardRef<HTMLTextAreaElement, ChatTextareaProps>(
  ({ className, variant = "default", autoFocus = true, ...props }, ref) => {
    return (
      <Textarea
        className={cn(
          "flex w-full rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          variant === "bordered" && "border-2",
          "min-h-[40px] max-h-[120px] pl-1",
          className,
        )}
        autoFocus={autoFocus}
        ref={ref}
        rows={1}
        {...props}
      />
    );
  },
);

ChatTextarea.displayName = "ChatTextarea";

export { ChatTextarea };
