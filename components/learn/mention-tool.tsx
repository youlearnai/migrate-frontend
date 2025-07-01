import React from "react";
import { AtSign } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import type { Content, EnhancedFeatureMentionItem } from "@/lib/types";
import { useParams } from "next/navigation";
import { useChatStore } from "@/hooks/use-chat-store";
import { useTranslation } from "react-i18next";
import { useFeatureMentions } from "@/lib/constants";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getMentionItems, MENTION_SECTIONS } from "@/lib/utils";

const MentionTool = ({
  chatContextContents,
}: {
  chatContextContents: Content[] | undefined;
}) => {
  const params = useParams();
  const { t } = useTranslation();
  const contentId = params.contentId as string;
  const { message, setMessage, setMessageForContent } = useChatStore();
  const toolMentions = useFeatureMentions();
  const featureMentions = getMentionItems(
    toolMentions,
    chatContextContents || [],
  );

  const handleMentionSelect = (feature: EnhancedFeatureMentionItem) => {
    const newMessage = message + ` @[${feature.id}] ` + " ";
    setMessage(newMessage);
    setMessageForContent(contentId, newMessage);
  };

  // Group items by section
  const groupedMentions = featureMentions.reduce(
    (groups, item) => {
      const section = item.itemType;
      if (!groups[section]) {
        groups[section] = [];
      }
      groups[section].push(item);
      return groups;
    },
    {} as Record<string, EnhancedFeatureMentionItem[]>,
  );

  // Get sections in order
  const sections = Object.entries(MENTION_SECTIONS)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([, value]) => ({
      type: value.type,
      headerText: value.headerText,
      items: groupedMentions[value.type] || [],
    }))
    .filter((section) => section.items.length > 0);

  return (
    <div className="relative">
      <TooltipProvider>
        <DropdownMenu>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`group border-1 min-w-8 rounded-full items-center text-muted-foreground hover:text-muted-foreground data-[state=open]:text-primary flex h-7 mb-1 text-xs w-fit focus:ring-0 focus:outline-none focus:ring-offset-0 transition-none dark:border-primary/20`}
                >
                  <AtSign className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="flex text-sm font-normal text-primary/70 items-center gap-1"
            >
              <p className="text-primary/90">{t("mentions.tooltip")}</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent
            loop
            className="rounded-lg w-48 max-h-[396px] overflow-y-auto"
          >
            {sections.map((section, sectionIndex) => (
              <React.Fragment key={section.type}>
                <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
                  {section.headerText}
                </DropdownMenuLabel>
                {section.items.map((feature) => (
                  <DropdownMenuItem
                    key={feature.id}
                    onClick={() => handleMentionSelect(feature)}
                    className="flex w-full items-center gap-2.5 p-2 group/item rounded-md text-primary/60 dark:text-primary/40 border border-transparent transition-all duration-100"
                    style={
                      {
                        "--feature-color": feature.color || "#000000",
                      } as React.CSSProperties
                    }
                  >
                    <div className="h-5 w-5 flex-shrink-0 flex items-center justify-center group-hover/item:text-[color:var(--feature-color)]">
                      {React.createElement(feature.logo, {
                        className: "feature-item  h-5 w-5",
                      })}
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <span className="text-sm font-medium leading-tight group-hover/item:text-primary/80 truncate">
                        {feature.display}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
                {sectionIndex < sections.length - 1 && (
                  <DropdownMenuSeparator className="my-1" />
                )}
              </React.Fragment>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>

      {/* Global styles for feature hover effects */}
      <style jsx global>{`
        .feature-item:hover {
          background-color: color-mix(
            in srgb,
            var(--feature-color) 10%,
            transparent
          );
          border-color: color-mix(
            in srgb,
            var(--feature-color) 50%,
            transparent
          );
        }
      `}</style>
    </div>
  );
};

export default MentionTool;
