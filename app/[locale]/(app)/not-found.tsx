"use client";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function NotFound({
  error,
}: {
  error: Error & { digest?: string };
}) {
  const router = useRouter();
  const { t } = useTranslation();

  const handleReset = () => {
    router.push("/");
  };

  useEffect(() => {
    console.log("Not Found Error: ", error);
    console.error("Not Found Error: ", error);
  }, [error]);

  return (
    <div className="h-screen w-full flex flex-col justify-center items-center">
      <AlertCircle
        className="w-24 h-24 mb-8 text-red-500 dark:text-red-400"
        aria-hidden="true"
      />
      <span className="text-4xl font-semibold mb-4 ">
        {t("notFound.title")}
      </span>
      <span className="text-xl font-semibold mb-4 ">
        {t("notFound.message")}
      </span>
      <Button
        title={t("notFound.homeButtonTitle")}
        className="mt-10 h-[50.5px] dark:bg-white text-md font-semibold w-[60%] md:w-[20%] bg-black text-white dark:text-black mb-4"
        onClick={handleReset}
      >
        {t("notFound.homeButton")}
      </Button>
      <h1 className="mt-2 lg:mb-12 mb-10 text-center">
        {t("notFound.troubleMessage")} &nbsp;
        <Link href="/contact" className="underline">
          {t("notFound.contactUs")}
        </Link>
      </h1>
    </div>
  );
}
