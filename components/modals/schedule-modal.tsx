import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { useModalStore } from "@/hooks/use-modal-store";
import Cal from "@calcom/embed-react";
import { useTranslation } from "react-i18next";

const ScheduleModal = () => {
  const { t } = useTranslation();
  const { isOpen, onClose, type, data } = useModalStore();
  const isModalOpen = isOpen && type === "schedule";

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogTitle>{t("schedule.title")}</DialogTitle>
        {data?.scheduleDescription && (
          <p className="text-sm text-muted-foreground mb-4">
            {t("schedule.description")}
          </p>
        )}
        <Cal
          calLink={data?.calLink as string}
          className="w-full h-full max-h-[65vh] my-1 rounded-lg overflow-scroll"
          config={{
            layout: "month_view",
          }}
        />
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            {t("onboarding.buttons.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleModal;
