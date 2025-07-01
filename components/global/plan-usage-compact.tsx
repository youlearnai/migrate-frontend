"use client";
import React, { useMemo } from "react";
import { cn, PAID_TIERS, UNLIMITED_TIERS } from "@/lib/utils";
import { validateInterval } from "@/lib/tier-constants";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

import { Progress } from "@/components/ui/progress";
import {
  useTotalChatLimit,
  useStudyGuideLimit,
  useAddContentLimit,
} from "@/query-hooks/limit";
import { useGetTier } from "@/query-hooks/user";
import useAuth from "@/hooks/use-auth";
import { Tier } from "@/lib/types";
import { useErrorStore } from "@/hooks/use-error-store";

export const PlanUsageCompact = React.memo(function PlanUsageCompact({
  className,
}: {
  className?: string;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { openModal } = useErrorStore();

  // Fetch all limits
  const {
    data: chatLimit,
    isLoading: chatLoading,
    error: chatError,
  } = useTotalChatLimit();
  const {
    data: studyGuideLimit,
    isLoading: studyGuideLoading,
    error: studyGuideError,
  } = useStudyGuideLimit();
  const {
    data: contentLimit,
    isLoading: contentLoading,
    error: contentError,
  } = useAddContentLimit();
  const { data: tier } = useGetTier();

  const isLoading = chatLoading || studyGuideLoading || contentLoading;
  const error = chatError || studyGuideError || contentError;

  const planType = useMemo(() => {
    if (!user || !tier) return null;
    if (tier === "anonymous") return null;

    // Return the tier directly with translation
    return t(tier);
  }, [tier, user, t]);

  const items = useMemo(() => {
    const results = [];

    // Content limits
    if (contentLimit) {
      const current = contentLimit.current_usage || 0;
      const total = contentLimit.limit || 0;
      const isUnlimited = total === -1 || total === null;
      const interval = contentLimit.interval || 1;

      results.push({
        key: "content",
        label: t("usage.content"),
        current,
        total: isUnlimited ? "∞" : total,
        percentage: isUnlimited ? 0 : total > 0 ? (current / total) * 100 : 0,
        isUnlimited,
        interval,
      });
    }

    // Chat limits
    if (chatLimit) {
      const current = chatLimit.current_usage || 0;
      const total = chatLimit.limit || 0;
      const isUnlimited = total === -1 || total === null;
      const interval = chatLimit.interval || 1;

      results.push({
        key: "chats",
        label: t("usage.chats"),
        current,
        total: isUnlimited ? "∞" : total,
        percentage: isUnlimited ? 0 : total > 0 ? (current / total) * 100 : 0,
        isUnlimited,
        interval,
      });
    }

    // Study Guide limits
    if (studyGuideLimit) {
      const current = studyGuideLimit.current_usage || 0;
      const total = studyGuideLimit.limit || 0;
      const isUnlimited = total === -1 || total === null;
      const interval = studyGuideLimit.interval || 1;

      results.push({
        key: "studyGuide",
        label: t("usage.studyGuide"),
        current,
        total: isUnlimited ? "∞" : total,
        percentage: isUnlimited ? 0 : total > 0 ? (current / total) * 100 : 0,
        isUnlimited,
        interval,
      });
    }

    return results;
  }, [chatLimit, studyGuideLimit, contentLimit, t]);

  if (error || !items.length) {
    return null;
  }

  // Only show for free users
  if (tier !== "free") {
    return null;
  }

  const handleUpgrade = () => {
    openModal(
      {
        status: 402,
        statusText: "Upgrade to continue",
      },
      {
        source: "plan-usage-compact",
      },
    );
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="rounded-lg bg-background/80 shadow-sm border border-primary/10 dark:border-primary/15 overflow-hidden backdrop-blur-sm ">
        {/* Header */}
        <div className="px-3 py-1.5 border-b border-primary/10 dark:border-primary/15">
          <div className="flex items-center">
            <span className="text-xs bg-green-500/10 text-green-500 dark:text-[#7DFF97] px-1 py-0.5 rounded-sm capitalize font-medium">
              {`${planType} ${t("Plan")}`}
            </span>
          </div>
        </div>

        {/* Usage Items */}
        <div className="px-3 py-2 space-y-2.5">
          {items.map((item) => (
            <div key={item.key} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">
                  {item.key === "chats" &&
                    `${t("planUsage.chats")} / ${validateInterval(item.interval, t)}`}
                  {item.key === "content" &&
                    `${t("planUsage.contents")} / ${validateInterval(item.interval, t)}`}
                  {item.key === "studyGuide" &&
                    `${t("planUsage.quizAnswers")} / ${validateInterval(item.interval, t)}`}
                </span>
                <span className="text-xs font-medium tabular-nums text-foreground/60">
                  {item.current}/{item.total}
                </span>
              </div>
              {!item.isUnlimited && (
                <Progress
                  value={item.percentage}
                  parentClassName="h-1.5"
                  className="bg-primary"
                />
              )}
            </div>
          ))}
        </div>

        {/* Upgrade CTA */}
        {!PAID_TIERS.includes(tier as Tier) && (
          <div className="px-3 pb-2">
            <Button
              variant="default"
              size="sm"
              className="w-full h-8 text-xs font-medium"
              onClick={handleUpgrade}
            >
              {t("header.upgrade")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});
