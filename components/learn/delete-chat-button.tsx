import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useModalStore } from "@/hooks/use-modal-store";
import { PenLine } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";

const DeleteChatButton = () => {
  const { t } = useTranslation();
  const { onOpen } = useModalStore();
  const params = useParams();

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <label htmlFor="image-upload" className="cursor-pointer">
            <Button
              onClick={() =>
                onOpen("clearChat", {
                  spaceId: params.spaceId as string,
                  contentId: params.contentId as string,
                })
              }
              variant="ghost"
              size="icon"
              className="text-muted-foreground/80 rounded-xl text-xs bg-transparent hover:bg-transparent hover:text-primary"
            >
              <PenLine className="flex-shrink-0 h-3.5 w-3.5" />
            </Button>
          </label>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t("chat.clearChat")}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default DeleteChatButton;
