import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@nextui-org/modal";
import useAuth from "@/hooks/use-auth";
import { useModalStore } from "@/hooks/use-modal-store";
import { useDeleteSpace } from "@/query-hooks/space";
import { useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

const SpaceDeleteModal = () => {
  const router = useRouter();
  const { isOpen, onClose, type, data } = useModalStore();
  const isModalOpen = isOpen && type === "spaceDelete";
  const params = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { mutate: deleteSpace } = useDeleteSpace();
  const { t } = useTranslation();

  const handleSpaceDelete = () => {
    if (params.spaceId === data.spaceId) {
      router.push("/");
    }
    deleteSpace(
      {
        spaceId: data.spaceId!,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["getHistory", user?.uid],
          });
        },
      },
    );
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
              {t("spaceDeleteModal.title")}
            </ModalHeader>
            <ModalBody className="text-sm text-primary/60">
              {t("spaceDeleteModal.description", {
                spaceName: data.spaceName,
                interpolation: { escapeValue: false },
              })}
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onClick={onClose}>
                {t("spaceDeleteModal.cancelButton")}
              </Button>
              <Button onClick={handleSpaceDelete} variant="destructive">
                {t("spaceDeleteModal.deleteButton")}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default SpaceDeleteModal;
