import { useRightSidebar } from "@/hooks/use-right-sidebar";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import Chats from "../learn/chats";

const RightSidebarContent = () => {
  const params = useParams();
  const { isOpen, setIsOpen, isFullWidth } = useRightSidebar();

  useEffect(() => {
    if (!params?.spaceId || (params?.spaceId && params?.contentId)) {
      if (isOpen) {
        setIsOpen(false);
      }
    }
  }, [params, isOpen, setIsOpen]);

  if (params.spaceId && !params.contentId) {
    return (
      <Chats className="md:h-[calc(100vh-84px)]" isFullWidth={isFullWidth} />
    );
  }

  return null;
};

export default RightSidebarContent;
