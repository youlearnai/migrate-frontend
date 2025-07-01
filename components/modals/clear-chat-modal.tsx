import { Button } from "@/components/ui/button";
import { useModalStore } from "@/hooks/use-modal-store";
import { useClearChatHistory } from "@/query-hooks/generation";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/modal";
import { useTranslation } from "react-i18next";

const ContentDeleteModal = () => {
  const { t } = useTranslation();
  const { isOpen, onClose, type, data } = useModalStore();
  const isModalOpen = isOpen && type === "clearChat";
  const { mutate: deleteChatHistory } = useClearChatHistory();

  const handleClearChat = () => {
    deleteChatHistory({
      contentId: data.contentId as string,
      spaceId: data.spaceId as string,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={onClose}
      backdrop="blur"
      placement="center"
      motionProps={{
        variants: {
          enter: {
            y: 0,
            opacity: 1,
            transition: {
              duration: 0.3,
              ease: "easeOut",
            },
          },
          exit: {
            y: -20,
            opacity: 0,
            transition: {
              duration: 0.2,
              ease: "easeIn",
            },
          },
        },
      }}
      classNames={{
        backdrop: "bg-black/50 backdrop-blur-md",
        base: "bg-white dark:bg-neutral-950 py-1 w-full max-w-lg",
        header: "border-b-0 mb-0 pb-0",
        footer: "border-t-0",
        closeButton:
          "hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:bg-transparent hover:text-primary p-1 right-2 top-2",
        body: "pt-0",
      }}
    >
      <ModalContent className="rounded-xl border">
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col space-y-1.5 text-center sm:text-left">
              {t("chatDeleteModal.title")}
            </ModalHeader>
            <ModalBody className="text-sm text-primary/60 font-semibold mt-1">
              {t("chatDeleteModal.description")}
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onClick={onClose}>
                {t("contentDeleteModal.cancel")}
              </Button>
              <Button onClick={handleClearChat} variant="default">
                {t("contentNewChat.new")}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default ContentDeleteModal;
