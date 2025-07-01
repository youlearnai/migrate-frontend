"use client";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useModalStore } from "@/hooks/use-modal-store";
import { useUser } from "@/query-hooks/user";
import {
  Book,
  DollarSign,
  NotebookPen,
  ThumbsUp,
  Chrome,
  Sparkles,
} from "lucide-react";
import { RxDiscordLogo } from "react-icons/rx";
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Feedback from "./feedback";
import {
  PREDEFINED_FEATURES,
  useNewFeatureStore,
} from "@/hooks/use-new-feature-store";

const LeftSidebarHelpTools = () => {
  const { t } = useTranslation();
  const { onOpen } = useModalStore();
  const [isOpen, setIsOpen] = useState(false);
  const { getActiveFeatures } = useNewFeatureStore();
  const { data: user } = useUser();

  const handleNewFeatures = () => {
    onOpen("newFeature", { allFeatures: PREDEFINED_FEATURES });
  };

  return (
    <div className="flex flex-col space-y-1">
      <Popover open={isOpen} onOpenChange={setIsOpen} modal>
        <PopoverTrigger asChild>
          <Button
            className="w-[232px] flex justify-start items-center p-2 h-fit truncate text-primary/80 hover:text-primary hover:bg-primary/5 underline-none text-left"
            size="sm"
            variant="plain"
          >
            <ThumbsUp className="h-4 w-4 mr-2" />
            <span className="text-sm font-normal">
              {t("accountMenu.feedback")}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          className="p-0 w-full max-w-[100vw] lg:max-w-md"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Feedback className="p-4" onClose={() => setIsOpen(false)} />
        </PopoverContent>
      </Popover>

      <Button
        onClick={() => onOpen("quickGuide")}
        className="w-[232px] flex justify-start items-center p-2 h-fit truncate text-primary/80 hover:text-primary hover:bg-primary/5 underline-none text-left"
        size="sm"
        variant="plain"
      >
        <Book className="h-4 w-4 mr-2" />
        <span className="text-sm font-normal">
          {t("accountMenu.guide")}
          {localStorage.getItem("guideClicked") !== "true" && (
            <sup>
              <div className="inline-block w-2 h-2 bg-green-500 rounded-full ml-1" />
            </sup>
          )}
        </span>
      </Button>

      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              onClick={() =>
                window.open(
                  "https://chromewebstore.google.com/detail/kchofibfnlabofiejaeodpgnhhcajjlj?utm_source=item-share-cb",
                  "_blank",
                )
              }
              className="w-[232px] flex justify-start items-center p-2 h-fit truncate text-primary/80 hover:text-primary hover:bg-primary/5 underline-none text-left"
              size="sm"
              variant="plain"
            >
              <Chrome className="h-4 w-4 mr-2" />
              <span className="text-sm font-normal items-center">
                {t("header.chromeExtension")}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <h4 className="font-semibold mb-1 text-xs">
              {t("header.chromeExtensionTitle", "YouLearn Chrome Extension")}
            </h4>
            <p className="text-xs text-muted-foreground">
              {t(
                "header.chromeExtensionDescription",
                "Add YouTube videos, websites, and more in one click",
              )}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {user &&
        user.is_power &&
        localStorage.getItem("feedbackCompleted") !== "true" && (
          <Button
            onClick={() => {
              onOpen("feedback");
              localStorage.setItem("feedback", "true");
              localStorage.setItem("feedbackClicked", "true");
            }}
            className="w-[232px] flex justify-start items-center p-2 h-fit truncate text-primary/80 hover:text-primary hover:bg-primary/5 underline-none text-left"
            size="sm"
            variant="plain"
          >
            <NotebookPen className="h-4 w-4 mr-2" />
            <span className="text-sm font-normal">
              {t("accountMenu.survey")}
              {localStorage.getItem("feedbackClicked") !== "true" && (
                <sup>
                  <div className="inline-block w-2 h-2 bg-green-500 rounded-full ml-1" />
                </sup>
              )}
            </span>
          </Button>
        )}

      <Link
        href="https://discord.com/invite/qNTWCCKpta"
        target="_blank"
        className="w-[232px]"
      >
        <Button
          className="w-full flex justify-start items-center p-2 h-fit truncate text-primary/80 hover:text-primary hover:bg-primary/5 underline-none text-left"
          size="sm"
          variant="plain"
        >
          <RxDiscordLogo className="h-4 w-4 mr-2" />
          <span className="text-sm font-normal">
            {t("accountMenu.discord")}
          </span>
        </Button>
      </Link>

      <Link href="/affiliate" className="w-[232px]">
        <Button
          className="w-full flex justify-start items-center p-2 h-fit truncate text-primary/80 hover:text-primary hover:bg-primary/5 underline-none text-left"
          size="sm"
          variant="plain"
        >
          <DollarSign className="h-4 w-4 mr-2" />
          <span className="text-sm font-normal">
            {t("accountMenu.affiliate")}
          </span>
        </Button>
      </Link>

      {!getActiveFeatures()?.length && (
        <div className="w-[232px]">
          <Button
            className="w-full flex justify-start items-center p-2 h-fit truncate text-primary/80 hover:text-primary hover:bg-primary/5 underline-none text-left"
            size="sm"
            variant="plain"
            onClick={handleNewFeatures}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            <span className="text-sm font-normal">
              {t("modals.newFeatures.badge")}
            </span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default LeftSidebarHelpTools;
