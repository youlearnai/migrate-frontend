import { useGetTier } from "@/query-hooks/user";
import { useTranslation } from "react-i18next";

export default function ProWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const { data: tier, isLoading } = useGetTier();

  if (isLoading) return null;

  return (
    <div className="flex flex-col justify-center items-center">
      <div className="text-center font-light dark:text-[#3CB371] text-[#3CB371] text-xs space-x-1 py-[.5px] px-[72px] flex rounded-t-lg bg-gradient-to-b from-[#3CB371]/10 to-[#3CB371]/5 dark:from-[#3CB371]/20 dark:to-[#3CB371]/5 backdrop-blur-sm border-t-[0.5px] border-l-[0.5px] border-r-[0.25px] border-[#3CB371]/50 dark:border-[#3CB371]">
        <p className="capitalize">{tier}</p>
        <p>{t("Plan")}</p>
      </div>
      <div className="w-full">{children}</div>
    </div>
  );
}
