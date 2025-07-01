import { useErrorStore } from "@/hooks/use-error-store";
import { useGetTier } from "@/query-hooks/user";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { usePricingLimit } from "@/query-hooks/limit";
import { useGetLocation, useGetPrice } from "@/query-hooks/price";
import { PAID_TIERS } from "@/lib/utils";
import { Tier } from "@/lib/types";

const UpgradeButton = ({ className }: { className?: string }) => {
  const { data, isLoading } = useGetTier();
  const { t } = useTranslation();
  const { openModal } = useErrorStore();
  const { data: location, isLoading: locationLoading } = useGetLocation();
  const { data: price, isLoading: priceLoading } = useGetPrice(
    location?.countryCode as string,
  );

  if (isLoading || locationLoading || priceLoading)
    return <Skeleton className="h-10 w-24" />;

  if (PAID_TIERS.includes(data as Tier)) return null;

  const handleUpgradeClick = () => {
    openModal(
      {
        status: 402,
        statusText: "Upgrade to continue",
      },
      {
        source: "upgrade-button-header",
      },
    );
  };

  const getTrialDays = () => {
    const proProduct = price?.products?.find((product) =>
      product.name.toLowerCase().includes("pro"),
    );
    return proProduct?.yearly?.metadata?.trial_period_days;
  };

  if (data === "free" || data === "anonymous") {
    const trialDays = getTrialDays();
    return (
      <Button className={className} variant="glow" onClick={handleUpgradeClick}>
        {trialDays ? t("upgrade.startNow") : t("header.upgrade")}
      </Button>
    );
  }
};

export default UpgradeButton;
