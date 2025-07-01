"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useModalStore } from "@/hooks/use-modal-store";
import { useGetSpace, useUpdateSpace } from "@/query-hooks/space";
import { Check, Link, Share } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCopyToClipboard } from "usehooks-ts";
import { useQueryClient } from "@tanstack/react-query";
import useAuth from "@/hooks/use-auth";

const ShareExamModal = () => {
  const { isOpen, onClose, type, data } = useModalStore();
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [_, copy] = useCopyToClipboard();
  const { mutate: updateSpace } = useUpdateSpace();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const isModalOpen = isOpen && type === "shareExamModal";
  const { spaceId, examId } = data;

  const { data: spaceData } = useGetSpace(spaceId!);
  const [currentVisibility, setCurrentVisibility] = useState(
    spaceData?.space?.visibility,
  );

  useEffect(() => {
    if (spaceData?.space) {
      setCurrentVisibility(spaceData.space.visibility);
    }
  }, [spaceData?.space]);

  const getShareUrl = () => {
    const domainName =
      typeof window !== "undefined" ? window.location.origin : "";
    return `${domainName}/exam/${examId}/space/${spaceId}`;
  };

  const handleCopy = async () => {
    if (currentVisibility === "private") {
      updateSpace(
        {
          spaceId: spaceId!,
          visibility: "public",
          spaceName: undefined,
          description: undefined,
        },
        {
          onSuccess: () => {
            setCurrentVisibility("public");
            queryClient.invalidateQueries({
              queryKey: ["getSpace", user?.uid || "anonymous", spaceId],
            });
          },
        },
      );
    }

    await copy(getShareUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="w-full">
        <DialogHeader>
          <div className="flex flex-col">
            <DialogTitle className="flex flex-row text-primary/70">
              <Share className="w-4 h-4 mr-2 mt-1" />
              <span className="text-base">
                {t("shareExam.dialogTitlePublic")}
              </span>
            </DialogTitle>
          </div>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <div className="bg-muted rounded-md p-2 text-sm truncate">
              {getShareUrl()}
            </div>
          </div>
          <Button onClick={handleCopy} className="flex items-center gap-2">
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                <span>{t("shareContentModal.copied")}</span>
              </>
            ) : (
              <>
                <Link className="h-4 w-4" />
                <span>
                  {currentVisibility === "public"
                    ? t("shareContentModal.copyLink")
                    : t("shareContentModal.createLink")}
                </span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareExamModal;
