import { useResizeStore } from "@/hooks/use-resize-store";
import { AdvancedMessageProps, MessageProps } from "@/lib/types";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import Markdown from "../global/markdown";
import { AdvancedPopover } from "../global/popovers";
import { SafeHighlightPopover } from "./safe-highlight-popover";
import ChatOptions from "./chat-options";

export const AdvancedMessage = ({
  children,
  type,
  id,
  className,
}: AdvancedMessageProps) => {
  const { isFullTab } = useResizeStore();

  const content = (
    <div
      className={cn(
        "w-fit rounded-3xl p-3 relative text-left leading-relaxed text-primary/95",
        className,
        type === "ai"
          ? "group p-0 pt-1 bg-background"
          : "bg-primary/5 dark:bg-neutral-800/50 border-primary/5",
      )}
    >
      {children}
    </div>
  );

  return (
    <div
      className={cn(
        "w-full flex",
        type === "ai" ? "justify-start" : "justify-end",
      )}
    >
      {type === "ai" ? (
        <SafeHighlightPopover
          renderPopover={({ selection }: { selection: string }) => (
            <AdvancedPopover text={selection} />
          )}
          offset={{ x: 0, y: -20 }}
          alignment="left"
          zIndex={90}
          minSelectionLength={1}
        >
          {content}
        </SafeHighlightPopover>
      ) : (
        content
      )}
    </div>
  );
};

const Message = ({
  text,
  type,
  id,
  is_voice,
  className,
  chatContextContents,
}: MessageProps) => {
  const pathname = usePathname();
  const isSpacePage = pathname.startsWith("/space");

  const content = (
    <div
      className={cn(
        "w-fit rounded-3xl p-3 relative text-left leading-relaxed text-primary/95",
        className,
        type === "ai"
          ? "group p-0 pt-1 bg-background"
          : "bg-primary/5 dark:bg-neutral-800/50 border border-primary/5",
      )}
    >
      <Markdown
        className={cn("whitespace-pre-wrap", is_voice ? "italic" : "")}
        type={isSpacePage ? "space" : "general"}
        chatContextContents={chatContextContents}
      >
        {type === "ai" ? text : is_voice ? `"${text}"` : text}
      </Markdown>
      {type === "ai" && (
        <ChatOptions className="mt-1 mb-4" content={text} messageId={id} />
      )}
    </div>
  );

  return (
    <div
      className={cn(
        "w-full flex",
        type === "ai" ? "justify-start" : "justify-end",
      )}
    >
      {type === "ai" ? (
        <SafeHighlightPopover
          renderPopover={({ selection }: { selection: string }) => (
            <AdvancedPopover text={selection} />
          )}
          offset={{ x: 0, y: -20 }}
          alignment="left"
          zIndex={90}
          minSelectionLength={1}
        >
          {content}
        </SafeHighlightPopover>
      ) : (
        content
      )}
    </div>
  );
};

export default Message;
