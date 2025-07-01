import Chats from "@/components/learn/chats";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useModalStore } from "@/hooks/use-modal-store";
import { useTranslation } from "react-i18next";

const SpaceModal = () => {
  const { isOpen, onClose, type, data } = useModalStore();
  const isModalOpen = isOpen && type === "spaceChatModal";
  const { t } = useTranslation();

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="sm:rounded-2xl rounded-2xl w-full max-w-3xl mx-auto">
        <DialogHeader>
          <DialogTitle className="bg-blur  text-2xl font-medium text-center my-2">
            {t("spaceDeleteModal.chatWith", {
              spaceName: data?.spaceDetails?.space?.name!,
              interpolation: { escapeValue: false },
            })}
          </DialogTitle>
        </DialogHeader>
        <Chats className="h-[80vh] max-w-[45rem] mx-auto" />
      </DialogContent>
    </Dialog>
  );
};

export default SpaceModal;
