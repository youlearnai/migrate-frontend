import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { useModalStore } from "@/hooks/use-modal-store";
import Image from "next/image";
import { cn } from "@/lib/utils";

const ImageModal = () => {
  const { isOpen, onClose, type, data } = useModalStore();
  const isModalOpen = isOpen && type === "image";

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className={cn("max-w-3xl overflow-hidden")}>
        <DialogTitle className="text-center text-2xl font-medium">
          {data?.title}
        </DialogTitle>
        {data?.src && (
          <Image
            src={data?.src!}
            alt={data?.src!}
            className={cn(
              "my-4 h-full min-w-full rounded-lg",
              data?.invert &&
                "dark:invert-[96.2%] dark:hue-rotate-180 dark:brightness-[80%] dark:contrast-[228%]",
            )}
            height={100}
            width={100}
            unoptimized
          />
        )}
        <DialogFooter></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageModal;
