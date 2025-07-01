import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "../ui/dialog";
import { Skeleton } from "../ui/skeleton";

export default function ModalSkeleton({
  isOpen,
  closeModal,
  className,
}: {
  isOpen: boolean;
  closeModal: () => void;
  className?: string;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent>
        <Skeleton
          className={cn("w-full mt-4 h-[60vh] rounded-2xl", className)}
        />
      </DialogContent>
    </Dialog>
  );
}
