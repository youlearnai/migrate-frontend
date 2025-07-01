"use client";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect } from "react";
import { useTranslation } from "react-i18next";
import posthog from "posthog-js";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    console.log("404 Error: ", error);
    console.error("404 Error: ", error);
    posthog.captureException(error);
  }, [error]);

  function refreshAndReset() {
    startTransition(() => {
      router.refresh();
      reset();
    });
  }

  return (
    <div className="h-screen w-full flex flex-col justify-center items-center">
      <AlertCircle
        className="w-24 h-24 mb-8 text-red-500 dark:text-red-400"
        aria-hidden="true"
      />
      <span className="text-4xl font-semibold mb-4 ">{t("error.title")}</span>
      <span className="text-xl font-semibold mb-4 ">{t("error.message")}</span>
      <Button
        title={t("error.homeButtonTitle")}
        className="mt-10 h-[50.5px] dark:bg-white text-md font-semibold w-[60%] md:w-[20%] bg-black text-white dark:text-black mb-4"
        onClick={refreshAndReset}
      >
        {t("forgetPassword.tryAgain")}
      </Button>
      <h1 className="mt-2 lg:mb-12 mb-10 text-center">
        {t("error.troubleMessage")} &nbsp;
        <Link href="/contact" className="underline">
          {t("error.contactUs")}
        </Link>
      </h1>
    </div>
  );
}
