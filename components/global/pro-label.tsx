import { useTranslation } from "react-i18next";

const ProLabel = () => {
  const { t } = useTranslation();

  return (
    <span className="text-[10px] bg-green-500/10 text-green-500 dark:text-[#7DFF97] px-1 py-0.5 rounded">
      {t("header.upgrade")}
    </span>
  );
};

export default ProLabel;
