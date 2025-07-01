import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAgenticModeStore } from "@/hooks/use-agentic-mode-store";
import useAuth from "@/hooks/use-auth";
import { useAgenticChatLimit, useTotalChatLimit } from "@/query-hooks/limit";
import { useGetTier } from "@/query-hooks/user";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { cn, HIGHEST_TIERS, UNLIMITED_TIERS } from "@/lib/utils";
import { Tier } from "@/lib/types";
import { Brain } from "lucide-react";

const AgenticMode = () => {
  const params = useParams();
  const { isAgentic, setIsAgentic, data: agenticData } = useAgenticModeStore();
  const { data: agenticChatLimit } = useAgenticChatLimit();
  const { data: totalChatLimit } = useTotalChatLimit();
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { data: tier } = useGetTier();

  const signInLink = `/signin${!pathname.includes("reset-password") ? `?returnUrl=${encodeURIComponent(pathname)}` : ""}`;

  useEffect(() => {
    if (agenticData && agenticData.contentId !== params.contentId) {
      setIsAgentic(true, { contentId: params.contentId as string });
    }
  }, [params.contentId, agenticData]);

  useEffect(() => {
    if (
      !UNLIMITED_TIERS.includes(tier as Tier) &&
      ((agenticChatLimit?.current_usage &&
        agenticChatLimit?.current_usage >= agenticChatLimit?.limit) ||
        (totalChatLimit?.current_usage &&
          totalChatLimit?.current_usage >= totalChatLimit?.limit))
    ) {
      setIsAgentic(false, { contentId: params.contentId as string });
    }
  }, [agenticChatLimit, totalChatLimit]);

  const renderTooltipContent = () => {
    // Anonymous users
    if (tier === "anonymous") {
      return (
        <p className="text-primary/90">{t("chatInput.accuracyModeTooltip")}</p>
      );
    }

    // Unlimited users
    if (UNLIMITED_TIERS.includes(tier as Tier)) {
      return <>{t("chatInput.accuracyModeTooltip")}</>;
    }

    // Pro users with limit reached
    if (
      (HIGHEST_TIERS.includes(tier as Tier) &&
        agenticChatLimit?.current_usage &&
        agenticChatLimit?.current_usage >= agenticChatLimit?.limit) ||
      (totalChatLimit?.current_usage &&
        totalChatLimit?.current_usage >= totalChatLimit?.limit)
    ) {
      return <>{t("learn.upgradeToLearnPlusPro")}</>;
    }

    // Non-pro users with limit reached
    if (
      (agenticChatLimit?.current_usage &&
        agenticChatLimit?.current_usage >= agenticChatLimit?.limit) ||
      (totalChatLimit?.current_usage &&
        totalChatLimit?.current_usage >= totalChatLimit?.limit)
    ) {
      return (
        <p className="text-primary/90 flex space-x-1">
          <p>{t("learn.upgradeToLearnPlus")}</p>
          <Link href="/pricing?source=learn-agentic-mode-button">
            <Button variant="link" className="p-0 underline text-xs h-4 w-12">
              {t("header.upgrade")}
            </Button>
          </Link>
        </p>
      );
    }

    return (
      <p className="text-primary/90">{t("chatInput.accuracyModeTooltip")}</p>
    );
  };

  if (loading) return null;

  const isButtonDisabled =
    tier !== "anonymous" &&
    agenticChatLimit?.current_usage !== undefined &&
    agenticChatLimit.limit !== undefined &&
    agenticChatLimit?.current_usage >= agenticChatLimit?.limit;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={400}>
        <div>
          <TooltipTrigger asChild>
            <span className="inline-block">
              <Button
                size="sm"
                type="button"
                variant={isAgentic ? "outline" : "outline"}
                className={`px-2 gap-x-1.5 py-1 h-7 text-xs font-medium text-center hover:text-primary/70 rounded-full border-1 mb-1 dark:border-primary/20 bg-transparent ${
                  isAgentic
                    ? "text-primary-foreground hover:bg-[#3CB371]/10 hover:text-[#3CB371] dark:text-[#3CB371] text-[#3CB371] bg-[#3CB371]/10 dark:bg-[#3CB371]/20 border-[#3CB371]/50 dark:border-[#3CB371]"
                    : "text-primary/70"
                }`}
                disabled={isButtonDisabled}
                onClick={() => {
                  if (!user) {
                    toast.message(t("flashcards.signInToAccess"));
                    router.push(signInLink);
                    return;
                  }
                  setIsAgentic(!isAgentic, {
                    contentId: params.contentId as string,
                  });
                }}
              >
                <Brain
                  className={cn(
                    "h-4 w-4",
                    !isAgentic && "text-muted-foreground",
                  )}
                />
                <span
                  className={cn(
                    "text-xs transition-all duration-300",
                    !isAgentic && "md:block hidden",
                  )}
                >
                  Learn+
                </span>
              </Button>
            </span>
          </TooltipTrigger>
        </div>
        <TooltipContent
          side="top"
          className="flex text-sm font-normal text-primary/70 items-center gap-1"
        >
          {renderTooltipContent()}

          {!UNLIMITED_TIERS.includes(tier as Tier) && (
            <>
              {tier !== "anonymous" && (
                <Separator
                  orientation="vertical"
                  className="h-4 text-primary/30"
                />
              )}

              {user && (
                <>
                  <p>
                    {agenticChatLimit?.limit || "-"} per{" "}
                    {agenticChatLimit?.interval || "month"}
                  </p>
                  <p>
                    (
                    {agenticChatLimit?.limit
                      ? `${Math.max(0, agenticChatLimit.limit - (agenticChatLimit?.current_usage || 0))} left`
                      : "-"}
                    )
                  </p>
                </>
              )}
            </>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AgenticMode;
