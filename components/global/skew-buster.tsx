"use client";
import { useEffect } from "react";
import { toast } from "sonner";
import { useSkewProtectionBusted } from "@/query-hooks/user";
import { useTranslation } from "react-i18next";

export function SkewProtectionBuster() {
  const { t } = useTranslation();
  const isBusted = useSkewProtectionBusted();

  useEffect(() => {
    if (isBusted) {
      const tid = toast(t("client_out_of_date"), {
        description: t("please_refresh_to_get_latest_version"),
        action: {
          label: t("refresh_now"),
          onClick: () => window.location.reload(),
        },
      });

      return () => {
        toast.dismiss(tid);
      };
    }
  }, [isBusted]);

  return null;
}
