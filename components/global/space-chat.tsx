import { useModalStore } from "@/hooks/use-modal-store";
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import { ModalData } from "@/lib/types";
import { useGetSpace } from "@/query-hooks/space";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useMediaQuery } from "usehooks-ts";
import { Button } from "../ui/button";
import { MessageSquare } from "lucide-react";
import { PiChatsCircleBold } from "react-icons/pi";

const SpaceChat = () => {
  const { onOpen } = useModalStore();
  const { isOpen, toggleOpen } = useRightSidebar();
  const { t } = useTranslation();
  const { spaceId } = useParams();
  const { data } = useGetSpace(spaceId as string);
  const isMobile = useMediaQuery("(max-width: 1280px)");

  const handleOpenSpaceChat = () => {
    if (isMobile) {
      // open modal
      onOpen("spaceChatModal", data as ModalData);
    } else {
      // open sidebar
      toggleOpen();
    }
  };

  if (isMobile) {
    return (
      <Button
        key="space-chat-button"
        onClick={handleOpenSpaceChat}
        className="flex items-center gap-2 shadow-[0_4px_10px_rgba(0,0,0,0.02)] hover:dark:border-neutral-700/40 bg-white dark:bg-neutral-800/50 text-primary/80 hover:text-primary hover:bg-transparent"
        variant="outline"
      >
        <PiChatsCircleBold className="mr-2 h-4 w-4" />
        <span key="space-chat-button-text">{t("spaceHeader.spaceChat")}</span>
      </Button>
    );
  }

  if (!data) return null;

  return (
    <div>
      <Button
        key="space-chat-button"
        onClick={handleOpenSpaceChat}
        className="flex items-center gap-2 shadow-[0_4px_10px_rgba(0,0,0,0.02)] hover:dark:border-neutral-700/40 bg-white dark:bg-neutral-800/50 text-primary/80 hover:text-primary hover:bg-transparent"
        variant="outline"
      >
        <PiChatsCircleBold className="mr-2 h-4 w-4" />
        <span key="space-chat-button-text">{t("spaceHeader.spaceChat")}</span>
      </Button>
    </div>
  );
};

export default SpaceChat;
