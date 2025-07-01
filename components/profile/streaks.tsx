import { useUserProfile } from "@/query-hooks/user";
import { Calendar, FileText, Flame } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

const Streaks = () => {
  const { t } = useTranslation();
  const { data: user } = useUserProfile();
  const data = [
    {
      icon: <Flame className="h-[90px] w-[90px]" />,
      value: user?.user_profile.streak,
      label: t("streaks.streak"),
    },
    {
      icon: <FileText className="h-[90px] w-[90px]" />,
      value: user?.user_dashboard.add_content_count,
      label: t("streaks.contentsCreated"),
    },
    {
      icon: <Calendar className="h-[90px] w-[90px]" />,
      value: user?.user_profile.active_days,
      label: t("streaks.totalActiveDays"),
    },
  ];

  return (
    <div
      className="flex-col flex md:flex-row space-y-5 lg:space-y-0 items-center justify-center w-full h-full lg:py-0 py-4"
      key="streaks-root"
    >
      {data.map((item, index) => (
        <div
          key={`streak-item-${index}`}
          className="flex-col flex text-center w-full"
        >
          <div
            className="flex flex-row justify-center"
            key={`streak-value-container-${index}`}
          >
            <div
              className="h-[90px] w-[90px] flex items-center justify-center"
              key={`streak-icon-container-${index}`}
            >
              {React.cloneElement(item.icon as React.ReactElement, {
                key: `streak-icon-${index}`,
              })}
            </div>
            <span
              className="text-[70px] mt-1 lg:mt-0"
              key={`streak-value-${index}`}
            >
              {item.value}
            </span>
          </div>
          <h1 className="text-sm ml-4" key={`streak-label-${index}`}>
            {item.label}
          </h1>
        </div>
      ))}
    </div>
  );
};

export default Streaks;
