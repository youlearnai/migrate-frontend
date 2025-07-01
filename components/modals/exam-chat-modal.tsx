import Chats from "@/components/learn/chats";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useModalStore } from "@/hooks/use-modal-store";
import { useTranslation } from "react-i18next";
import SpaceExamChat from "../space/space-exam-chat";

const ExamChatModal = () => {
  const { isOpen, onClose, type, data } = useModalStore();
  const isModalOpen = isOpen && type === "examChatModal";
  const { t } = useTranslation();

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="sm:rounded-2xl rounded-2xl w-full max-w-3xl mx-auto">
        <DialogHeader>
          <DialogTitle className="bg-blur  text-2xl font-medium text-center my-2">
            {t("examHeader.spaceChat")}
          </DialogTitle>
        </DialogHeader>
        <SpaceExamChat className="h-[80vh] mx-auto" spaceId={data?.spaceId!} />
      </DialogContent>
    </Dialog>
  );
};

export default ExamChatModal;
