import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { useModalStore } from "@/hooks/use-modal-store";
import { ContentType } from "@/lib/types";
import { cn, isAudioType, isDocumentType, isVideoType } from "@/lib/utils";
import dynamic from "next/dynamic";
import WavePlayer from "../learn/wave-player";
import ReactPlayer from "react-player";
import Link from "next/link";
import { Button } from "../ui/button";
import { ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";

const PDFViewer = dynamic(() => import("../learn/pdf-viewer"), { ssr: false });

const ContentPreviewModal = () => {
  const { t } = useTranslation();
  const { isOpen, onClose, type, data } = useModalStore();
  const isModalOpen = isOpen && type === "contentPreview";
  const { src, contentId, title, contentType } = data;

  if (!isModalOpen) return null;

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "max-w-7xl max-h-[90vh] py-5 px-0 h-full overflow-hidden",
          isAudioType(contentType as ContentType) && "h-auto",
        )}
      >
        <DialogHeader className="flex flex-row items-center justify-between p-4 pb-2 border-b">
          <DialogTitle className="text-lg font-semibold text-primary truncate">
            {title || "Content Preview"}
          </DialogTitle>
          <Link href={`/learn/content/${contentId}`} target="_blank">
            <Button variant="outline" size="sm" className="w-fit gap-2">
              <ExternalLink className="h-4 w-4" />
              <span>{t("open")}</span>
            </Button>
          </Link>
        </DialogHeader>
        <div className="px-4 overflow-hidden">
          {isVideoType(contentType as ContentType) && (
            <div key="video-player" className="aspect-video">
              <ReactPlayer
                key="video-player"
                url={src as string}
                height="100%"
                width="100%"
                controls
                muted
                loop={false}
                config={{
                  file: {
                    attributes: {
                      controlsList: "nodownload",
                    },
                    forceVideo: true,
                  },
                }}
              />
            </div>
          )}
          {isDocumentType(contentType as ContentType) && (
            <PDFViewer key="pdf-native-viewer" fileUrl={src as string} />
          )}
          {isAudioType(contentType as ContentType) && (
            <WavePlayer key="wave-player" audioUrl={src as string} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContentPreviewModal;
