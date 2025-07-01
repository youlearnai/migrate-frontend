"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useModalStore } from "@/hooks/use-modal-store";
import { useDeleteAccount } from "@/query-hooks/user";
import { useTranslation } from "react-i18next";
import { getMarketingBaseUrl } from "@/lib/domains";

export default function AccountDeleteModal() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isOpen, onClose, type } = useModalStore();
  const { mutate: deleteUser } = useDeleteAccount();
  const isModalOpen = isOpen && type === "accountDelete";
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = async () => {
    deleteUser(undefined, {
      onSuccess: (data) => {
        if (data) window.location.href = getMarketingBaseUrl();
      },
    });
  };

  const isDeleteEnabled = confirmText === "Yes I am sure.";

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>
            {t("accountDeleteModal.deleteAccountConfirmation")}
          </DialogTitle>
          <DialogDescription>
            {t("accountDeleteModal.deleteAccountDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-neutral-500 mb-2">
            {t("accountDeleteModal.confirmInstruction", {
              message: "Yes I am sure.",
              interpolation: { escapeValue: false },
            })}
          </p>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Yes I am sure."
          />
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            {t("accountDeleteModal.cancelButton")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isDeleteEnabled}
          >
            {t("accountDeleteModal.deleteButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
