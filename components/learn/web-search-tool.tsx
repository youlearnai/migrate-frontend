import { Globe } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { Toggle } from "../ui/toggle";
import { useWebSearchStore } from "@/hooks/use-web-search-store";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const WebSearchTool = () => {
  const { isWebSearch, onWebSearch } = useWebSearchStore();
  const { t } = useTranslation();
  const handleWebSearchChange = (value: boolean) => {
    onWebSearch(value);
  };

  return (
    <TooltipProvider delayDuration={400}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Toggle
            variant="blue"
            pressed={isWebSearch}
            onPressedChange={handleWebSearchChange}
            className={cn(
              "border-1 rounded-2xl flex h-7 mb-1 text-xs px-2 gap-x-1.5 py-1.5 w-fit focus:ring-0 focus:outline-none focus:ring-offset-0 dark:border-primary/20 bg-transparent",
              isWebSearch
                ? "!bg-blue-100/80 dark:!bg-blue-500/20 border-blue-500/50 dark:border-blue-500/90"
                : "text-primary/60",
              !isWebSearch &&
                "md:rounded-2xl rounded-full border md:w-auto w-7 md:min-w-fit min-w-8",
            )}
          >
            <Globe
              className={`w-4 h-4 ${isWebSearch ? "text-blue-500/90 dark:text-blue-500" : ""}`}
            />
            <span
              className={cn(
                "text-xs transition-all duration-300",
                isWebSearch && "text-blue-500/90 dark:text-blue-500",
                !isWebSearch && "md:block hidden",
              )}
            >
              {t("search")}
            </span>
          </Toggle>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t("searchTheWeb")}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default WebSearchTool;
