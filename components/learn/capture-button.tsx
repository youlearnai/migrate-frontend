import { useCaptureStore } from "@/hooks/use-capture-store";
import { useErrorStore } from "@/hooks/use-error-store";
import { cn } from "@/lib/utils";
import { useGetTier } from "@/query-hooks/user";
import { CameraIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

const CaptureButton = () => {
  const { t } = useTranslation();
  const { isCapturing, setIsCapturing } = useCaptureStore();
  const { data: tier } = useGetTier();
  const { openModal } = useErrorStore();
  const pathname = usePathname();
  const router = useRouter();

  const signInLink = `/signin${!pathname.includes("reset-password") ? `?returnUrl=${encodeURIComponent(pathname)}` : ""}`;

  const handleCapture = () => {
    switch (tier) {
      case "anonymous":
        toast.message(t("flashcards.signInToAccess"));
        router.push(signInLink);
        break;
      case "free":
        openModal(
          {
            status: 402,
            statusText: "Upgrade to continue",
          },
          {
            source: "capture-button",
          },
        );
        toast.message(t("upgrade.access"));
        break;
      case "core":
      case "pro":
      case "plus":
      case "unlimited":
        setIsCapturing(true);
        break;
    }
  };

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isCapturing) {
        setIsCapturing(false);
      }
    };

    if (isCapturing) {
      window.addEventListener("keydown", handleEscKey);
    }

    return () => {
      window.removeEventListener("keydown", handleEscKey);
    };
  }, [isCapturing, setIsCapturing]);

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            type="button"
            className={cn(
              "rounded-md text-primary/50 hover:text-primary/50 mb-1",
              isCapturing && "bg-muted text-muted-foreground",
            )}
            size="messageIcon"
            onClick={handleCapture}
          >
            <CameraIcon className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t("capture.tooltip")}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CaptureButton;
