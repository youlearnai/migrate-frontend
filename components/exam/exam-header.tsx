"use client";
import { useLeftSidebar } from "@/hooks/use-left-sidebar";
import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { useGetSpaceExam } from "@/query-hooks/exam";
import { RightSidebar } from "../global/right-sidebar";
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import { Button } from "../ui/button";
import SpaceExamChat from "../space/space-exam-chat";
import { useMediaQuery } from "usehooks-ts";
import { useModalStore } from "@/hooks/use-modal-store";
import { ModalData } from "@/lib/types";
import { PiChatsCircleBold } from "react-icons/pi";
import { useTranslation } from "react-i18next";

const ExamHeader = () => {
  const params = useParams();
  const { isOpen: isLeftSidebarOpen, setIsOpen: setIsLeftSidebarOpen } =
    useLeftSidebar();
  const { data: spaceExam, isLoading: isSpaceExamLoading } = useGetSpaceExam(
    params.examId as string,
  );
  const { toggleOpen: toggleRightSidebar } = useRightSidebar();
  const { onOpen } = useModalStore();
  const isMobile = useMediaQuery("(max-width: 1280px)");
  const { t } = useTranslation();

  const handleOpenSpaceChat = () => {
    if (isMobile) {
      onOpen("examChatModal", {
        spaceId: spaceExam?.user_exam.space.id as string,
      } as ModalData);
    } else {
      toggleRightSidebar();
    }
  };

  useEffect(() => {
    if (isLeftSidebarOpen) {
      setIsLeftSidebarOpen?.(false);
    }
  }, [isLeftSidebarOpen, setIsLeftSidebarOpen]);

  if (isSpaceExamLoading) {
    return null;
  }

  if (!spaceExam?.submitted_at) {
    return null;
  }

  return (
    <div className="z-10 bg-background justify-end flex p-2 md:p-4">
      <div className="hidden xl:flex mx-10">
        <RightSidebar>
          <SpaceExamChat spaceId={spaceExam.user_exam.space.id as string} />
        </RightSidebar>
      </div>
      <Button
        variant="outline"
        onClick={handleOpenSpaceChat}
        className="size-icon xl:size-auto xl:px-4 gap-x-2"
      >
        <PiChatsCircleBold className="h-4 w-4" />
        <span className="hidden xl:inline">{t("examHeader.spaceChat")}</span>
      </Button>
    </div>
  );
};

export default ExamHeader;
