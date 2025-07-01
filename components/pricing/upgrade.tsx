"use client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useAuth from "@/hooks/use-auth";
import {
  useCorePlanBenefits,
  useTeamPlanBenefits,
  useFreePlanBenefits,
  usePlusPlanBenefits,
  useProPlanBenefits,
  useUnlimitedPlanBenefits,
} from "@/lib/tier-constants";
import { usePricingLimit } from "@/query-hooks/limit";
import { useGetLocation, useGetPrice } from "@/query-hooks/price";
import { useCheckout } from "@/query-hooks/user";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import PriceCard from "./price-card";
import { Tier } from "@/lib/types";
import { useModalStore } from "@/hooks/use-modal-store";

const TIER_BG_COLOR_MAP: Record<Tier, string> = {
  free: "bg-gradient-to-br from-white to-neutral-100 dark:from-neutral-900 dark:to-neutral-800",
  core: "bg-gradient-to-br from-neutral-900 to-neutral-800 dark:from-neutral-100 dark:to-neutral-200",
  pro: "bg-gradient-to-br from-neutral-900 to-neutral-800 dark:from-neutral-100 dark:to-neutral-200",
  plus: "bg-gradient-to-br from-neutral-900 to-neutral-800 dark:from-neutral-200 dark:to-neutral-300",
  unlimited:
    "bg-gradient-to-br from-white to-neutral-100 dark:from-neutral-900 dark:to-neutral-800",
  team: "bg-gradient-to-br from-white to-neutral-100 dark:from-neutral-900 dark:to-neutral-800",
};

const TIER_BORDER_COLOR_MAP: Record<Tier, string> = {
  free: "border",
  core: "border-none",
  pro: "border-none",
  plus: "border-none",
  unlimited: "border",
  team: "border",
};

const TIER_TEXT_COLOR_MAP: Record<Tier, string> = {
  free: "text-neutral-800 dark:text-neutral-200",
  core: "text-white dark:text-black",
  pro: "text-white dark:text-black",
  plus: "text-white dark:text-black",
  unlimited: "text-neutral-800 dark:text-neutral-200",
  team: "text-neutral-800 dark:text-neutral-200",
};

const TIER_SKELETON_COLOR_MAP: Record<Tier, string> = {
  free: "bg-neutral-300 dark:bg-neutral-700",
  core: "bg-neutral-700 dark:bg-neutral-300",
  pro: "bg-neutral-700 dark:bg-neutral-300",
  plus: "bg-neutral-700 dark:bg-neutral-300",
  unlimited: "bg-neutral-300 dark:bg-neutral-700",
  team: "bg-neutral-300 dark:bg-neutral-700",
};

const TIER_BUTTON_STYLE_MAP: Record<Tier, string> = {
  free: "dark:hover:bg-neutral-200 hover:text-white font-normal text-md text-white bg-[#121212] dark:bg-white dark:text-[#121212] flex items-center justify-center rounded-full h-[50.5px] w-full border-1 hover:bg-neutral-900",
  core: "bg-white hover:bg-neutral-200 dark:bg-[#121212] text-black dark:text-white text-md font-normal flex items-center justify-center rounded-full h-[50.5px] dark:hover:bg-black/80 w-full",
  pro: "bg-white hover:bg-neutral-200 dark:bg-[#121212] text-black dark:text-white text-md font-normal flex items-center justify-center rounded-full h-[50.5px] dark:hover:bg-black/80 w-full",
  plus: "bg-white hover:bg-neutral-200 dark:bg-[#121212] text-black dark:text-white text-md font-normal flex items-center justify-center rounded-full h-[50.5px] dark:hover:bg-black/80 w-full",
  unlimited:
    "dark:hover:bg-neutral-200 hover:text-white font-normal text-md text-white bg-[#121212] dark:bg-white dark:text-[#121212] flex items-center justify-center rounded-full h-[50.5px] w-full border-1 hover:bg-neutral-900",
  team: "dark:hover:bg-neutral-200 hover:text-white font-normal text-md text-white bg-[#121212] dark:bg-white dark:text-[#121212] flex items-center justify-center rounded-full h-[50.5px] w-full border-1 hover:bg-neutral-900",
};

const Upgrade = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { onOpen } = useModalStore();
  const { t } = useTranslation();
  const [billingFrequency, setBillingFrequency] = useState<
    "monthly" | "quarterly" | "yearly"
  >("yearly");
  const [loadingPlan, setLoadingPlan] = useState<Tier | null>(null);
  const { data: pricingLimit, isLoading: pricingLimitLoading } =
    usePricingLimit();
  const freePlanBenefits = useFreePlanBenefits(pricingLimit);
  const corePlanBenefits = useCorePlanBenefits(pricingLimit);
  const proPlanBenefits = useProPlanBenefits(pricingLimit);
  const plusPlanBenefits = usePlusPlanBenefits(pricingLimit);
  const teamPlanBenefits = useTeamPlanBenefits(pricingLimit);
  const unlimitedPlanBenefits = useUnlimitedPlanBenefits(pricingLimit);
  const { data: location, isLoading: locationLoading } = useGetLocation();
  const { data: price, isLoading } = useGetPrice(
    location?.countryCode as string,
  );

  const DEFAULT_PRICE = price?.products.find((product) =>
    product.name.toLowerCase().includes("plus"),
  )?.name
    ? "Plus"
    : "Pro";

  const handleHomeClick = () => {
    if (user?.uid) {
      router.push("/");
    } else {
      toast.error(t("upgrade.signInError"));
      router.push("/signin");
    }
  };

  const { mutate: checkoutSession } = useCheckout();

  const handleUpgrade = async (plan: Tier) => {
    if (!user?.uid) {
      toast.error(t("upgrade.signInUpgradeError"));
      router.push("/signin");
    } else {
      setLoadingPlan(plan);
      checkoutSession(
        {
          priceId:
            billingFrequency === "yearly"
              ? price?.products?.find((product) =>
                  product.name.toLowerCase().includes(plan.toLowerCase()),
                )?.yearly?.stripe_price_id!
              : billingFrequency === "quarterly"
                ? price?.products?.find((product) =>
                    product.name.toLowerCase().includes(plan.toLowerCase()),
                  )?.quarterly?.stripe_price_id!
                : price?.products?.find((product) =>
                    product.name.toLowerCase().includes(plan.toLowerCase()),
                  )?.monthly?.stripe_price_id!,
          country: location?.countryCode ?? "US",
          tier: plan,
          path: window?.location?.search,
        },
        {
          onSuccess: (data) => {
            router.push(`${data?.url!}`);
          },
          onSettled: () => {
            setLoadingPlan(null);
          },
        },
      );
    }
  };

  const getPriceForPlan = (
    planName: string,
    period: "monthly" | "quarterly" | "yearly",
  ) => {
    const proPlan = price?.products?.find((product) =>
      product.name.toLowerCase().includes(DEFAULT_PRICE),
    );

    const currencySymbol =
      proPlan?.monthly?.formatted_price?.replace(/[\d,\.]+/g, "").trim() ||
      proPlan?.yearly?.formatted_price?.replace(/[\d,\.]+/g, "").trim() ||
      "$";

    if (planName === "Free") {
      return {
        price: 0,
        formatted_price: `${currencySymbol}0`,
      };
    }

    const plan = price?.products?.find((product) =>
      product.name.toLowerCase().includes(planName.toLowerCase()),
    );

    if (period === "monthly") {
      return {
        price: plan?.monthly?.price ?? 0,
        formatted_price: plan?.monthly?.formatted_price ?? `${currencySymbol}0`,
      };
    } else if (period === "quarterly") {
      return {
        price: Math.round((plan?.quarterly?.price ?? 0) / 3),
        formatted_price: plan?.quarterly?.formatted_price
          ? plan.quarterly.formatted_price.replace(/(\d+)/, (match) =>
              Math.round(parseInt(match) / 3).toString(),
            )
          : `${currencySymbol}0`,
      };
    }
    return {
      price: Math.round((plan?.yearly?.price ?? 0) / 12),
      formatted_price: plan?.yearly?.formatted_price
        ? plan.yearly.formatted_price.replace(/(\d+)/, (match) =>
            Math.round(parseInt(match) / 12).toString(),
          )
        : `${currencySymbol}0`,
    };
  };

  const getBenefitsForPlan = (planName: string) => {
    switch (planName) {
      case "Plus":
        return plusPlanBenefits;
      case "Unlimited":
        return unlimitedPlanBenefits;
      case "Pro":
        return proPlanBenefits;
      case "Core":
        return corePlanBenefits;
      default:
        return [];
    }
  };

  const handleTeamPlanClick = () => {
    if (!user?.uid) {
      toast.error(t("upgrade.signInUpgradeError"));
      router.push("/signin");
    } else {
      onOpen("teamPricingFormModal");
    }
  };

  return (
    <>
      <div className="flex flex-col items-center md:gap-4">
        <div className="mt-12 mb-6 w-full flex items-center justify-center text-center ">
          <div className="w-full flex-col">
            <h1 className="text-3xl lg:text-4xl font-normal text-center">
              {t("upgrade.heading")}
            </h1>
            <h2 className="text-lg lg:text-xl font-normal text-center mt-6 text-neutral-500 dark:text-neutral-400">
              {t("upgrade.subheading")}
            </h2>
          </div>
        </div>
        {/* Billing Plans and Info */}
        <div className="flex flex-col items-center justify-center gap-6 lg:gap-12">
          <Tabs
            value={billingFrequency}
            onValueChange={(value) =>
              setBillingFrequency(value as "monthly" | "quarterly" | "yearly")
            }
          >
            <TabsList className="bg-transparent h-auto min-h-[48px] rounded-full dark:bg-neutral-800/90 bg-neutral-100 p-1">
              <TabsTrigger
                value="monthly"
                className="rounded-full h-auto min-h-[40px] py-2 w-full text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:shadow-sm data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white data-[state=inactive]:text-neutral-500 dark:data-[state=inactive]:text-neutral-400"
              >
                {t("upgrade.payMonthly")}
              </TabsTrigger>
              {price?.products?.[0]?.quarterly && !isLoading && (
                <TabsTrigger
                  value="quarterly"
                  className="rounded-full h-auto min-h-[40px] py-2 w-full text-sm flex flex-col sm:flex-row justify-between items-center gap-1 data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:shadow-sm data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white data-[state=inactive]:text-neutral-500 dark:data-[state=inactive]:text-neutral-400"
                >
                  <span>{t("upgrade.payQuarterly")}</span>
                  {!isLoading &&
                    getPriceForPlan(DEFAULT_PRICE, "quarterly").price !== 0 &&
                    !isNaN(
                      getPriceForPlan(DEFAULT_PRICE, "quarterly").price,
                    ) && (
                      <span
                        className={`text-xs text-emerald-500 dark:text-green-400 p-1 rounded-full`}
                      >
                        {t("priceCard.savePercentage", {
                          save: Math.round(
                            (1 -
                              getPriceForPlan(DEFAULT_PRICE, "quarterly")
                                .price /
                                getPriceForPlan(DEFAULT_PRICE, "monthly")
                                  .price) *
                              100,
                          ),
                        })}
                      </span>
                    )}
                </TabsTrigger>
              )}
              <TabsTrigger
                value="yearly"
                className="rounded-full h-auto min-h-[40px] py-2 w-full text-sm flex flex-row justify-between items-center gap-1 data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:shadow-sm data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white data-[state=inactive]:text-neutral-500 dark:data-[state=inactive]:text-neutral-400"
              >
                <span>{t("upgrade.payYearly")}</span>
                {!isLoading &&
                  getPriceForPlan(DEFAULT_PRICE, "yearly").price !== 0 &&
                  !isNaN(getPriceForPlan(DEFAULT_PRICE, "yearly").price) && (
                    <span
                      className={`text-xs text-emerald-500 dark:text-green-400 p-1 rounded-full`}
                    >
                      {t("priceCard.savePercentage", {
                        save: Math.round(
                          (1 -
                            getPriceForPlan(DEFAULT_PRICE, "yearly").price /
                              getPriceForPlan(DEFAULT_PRICE, "monthly").price) *
                            100,
                        ),
                      })}
                    </span>
                  )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex justify-center">
            <div className="flex lg:flex-row flex-col gap-8 px-4 items-center">
              <PriceCard
                billingPeriod={
                  billingFrequency === "monthly"
                    ? "month"
                    : billingFrequency === "quarterly"
                      ? "quarter"
                      : "year"
                }
                plan="Free"
                price={0}
                subTitle={t("upgrade.freePlan.subTitle")}
                planBenefits={freePlanBenefits}
                buttonText={t("upgrade.freePlan.buttonText")}
                buttonStyle={TIER_BUTTON_STYLE_MAP["free"]}
                handleClick={handleHomeClick}
                currency={
                  getPriceForPlan("Free", billingFrequency).formatted_price
                }
                isLoading={pricingLimitLoading || locationLoading}
                bgColor={TIER_BG_COLOR_MAP["free"]}
                textColor={TIER_TEXT_COLOR_MAP["free"]}
                skeletonColor={TIER_SKELETON_COLOR_MAP["free"]}
                borderColor={TIER_BORDER_COLOR_MAP["free"]}
              />
              {price?.products?.map((product) => (
                <PriceCard
                  key={product.name}
                  highlight
                  billingPeriod={
                    billingFrequency === "monthly"
                      ? "month"
                      : billingFrequency === "quarterly"
                        ? "quarter"
                        : "year"
                  }
                  plan={product.name}
                  price={getPriceForPlan(product.name, billingFrequency).price}
                  subTitle={t(
                    `upgrade.${product.name.toLowerCase()}Plan.subTitle`,
                  )}
                  planBenefits={getBenefitsForPlan(product.name)}
                  isPopular={
                    product.name === "Plus" ? t("magicBar.mostUsed") : undefined
                  }
                  freeTrialDays={
                    price?.products?.find((product) =>
                      product.name
                        .toLowerCase()
                        .includes(product.name.toLowerCase()),
                    )?.[billingFrequency]?.metadata?.trial_period_days ??
                    undefined
                  }
                  buttonText={
                    price?.products?.find((product) =>
                      product.name
                        .toLowerCase()
                        .includes(product.name.toLowerCase()),
                    )?.[billingFrequency]?.metadata?.trial_period_days
                      ? t("upgrade.trial", {
                          day: price?.products?.find((product) =>
                            product.name
                              .toLowerCase()
                              .includes(product.name.toLowerCase()),
                          )?.[billingFrequency]?.metadata?.trial_period_days,
                        })
                      : t(`upgrade.proPlan.buttonText`)
                  }
                  buttonStyle={
                    TIER_BUTTON_STYLE_MAP[product.name.toLowerCase() as Tier]
                  }
                  handleClick={() =>
                    handleUpgrade(product.name.toLowerCase() as Tier)
                  }
                  isProcessing={loadingPlan === product.name}
                  isLoading={
                    isLoading ||
                    price?.products?.[0]?.yearly?.price === 0 ||
                    pricingLimitLoading ||
                    locationLoading
                  }
                  savePercentage={Math.round(
                    (1 -
                      getPriceForPlan(product.name, "yearly").price /
                        getPriceForPlan(product.name, "monthly").price) *
                      100,
                  )}
                  currency={
                    getPriceForPlan(product.name, billingFrequency)
                      .formatted_price
                  }
                  bgColor={
                    TIER_BG_COLOR_MAP[product.name.toLowerCase() as Tier]
                  }
                  textColor={
                    TIER_TEXT_COLOR_MAP[product.name.toLowerCase() as Tier]
                  }
                  skeletonColor={
                    TIER_SKELETON_COLOR_MAP[product.name.toLowerCase() as Tier]
                  }
                  borderColor={
                    TIER_BORDER_COLOR_MAP[product.name.toLowerCase() as Tier]
                  }
                />
              ))}
              <PriceCard
                plan="Team"
                price={-1}
                currency={""}
                subTitle={t("upgrade.teamPlan.subTitle")}
                planBenefits={teamPlanBenefits}
                buttonText={t("error.contactUs")}
                buttonStyle={TIER_BUTTON_STYLE_MAP["team"]}
                billingPeriod="none"
                isLoading={pricingLimitLoading || locationLoading}
                bgColor={TIER_BG_COLOR_MAP["team"]}
                textColor={TIER_TEXT_COLOR_MAP["team"]}
                skeletonColor={TIER_SKELETON_COLOR_MAP["team"]}
                borderColor={TIER_BORDER_COLOR_MAP["team"]}
                handleClick={handleTeamPlanClick}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Upgrade;
