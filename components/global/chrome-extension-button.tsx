import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Chrome } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ChromeExtensionButton: React.FC = () => {
  const { t } = useTranslation();

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className="hidden items-center gap-2 whitespace-nowrap md:flex hover:shadow-md hover:dark:shadow-[0_0_8px_rgba(255,255,255,0.1)] bg-neutral-100/20 dark:bg-neutral-900/30 hover:bg-transparent"
            onClick={() =>
              window.open(
                "https://chromewebstore.google.com/detail/kchofibfnlabofiejaeodpgnhhcajjlj?utm_source=item-share-cb",
                "_blank",
              )
            }
          >
            <Chrome className="h-4 w-4" />
            {t("header.chromeExtension")}
            <span className="text-[10px] bg-green-500/10 text-green-500 dark:text-[#7DFF97] px-1 py-0.5 rounded-sm border border-green-500/20 uppercase">
              {t("new")}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <h4 className="font-semibold mb-1 text-xs">
            YouLearn Chrome Extension
          </h4>
          <p className="text-xs text-muted-foreground">
            Add YouTube videos, websites, and more in one click
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ChromeExtensionButton;
