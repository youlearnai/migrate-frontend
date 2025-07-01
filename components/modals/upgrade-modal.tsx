"use client";

import Spinner from "@/components/global/spinner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useErrorStore } from "@/hooks/use-error-store";
import {
  useCorePlanBenefits,
  usePlusPlanBenefits,
  useProPlanBenefits,
  useUnlimitedPlanBenefits,
} from "@/lib/tier-constants";
import { useUpgradeModalEvent } from "@/query-hooks/event";
import { usePricingLimit } from "@/query-hooks/limit";
import { useGetLocation, useGetPrice } from "@/query-hooks/price";
import {
  useCheckout,
  useGetTier,
  useGetUserUpgradeLimitFirstReachedTime,
  useUser,
} from "@/query-hooks/user";
import { Check, Info } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import ModalSkeleton from "../skeleton/modal-skeleton";
import DiscountTag from "../pricing/discount-tag";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/modal";
import { Tier } from "@/lib/types";
import { HIGHEST_TIERS } from "@/lib/utils";
import { lowerCase } from "lodash";
import TierLimitUpgradeModalContent from "./tier-limit-upgrade-modal-content";
import { useModalStore as useNormalModalStore } from "@/hooks/use-modal-store";

const UpgradeModal = () => {
  const { t } = useTranslation();
  const { isOpen, closeModal, error, data } = useErrorStore();
  const { onOpen } = useNormalModalStore();
  const fromOnboarding =
    data?.source === `onboarding-modal-signup_modal_061425`;
  const router = useRouter();
  const { mutate: checkoutSession, isPending } = useCheckout();
  const { data: tier, isLoading: isTierLoading } = useGetTier();
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<
    "monthly" | "quarterly" | "yearly"
  >("yearly");
  const { data: location, isLoading: locationLoading } = useGetLocation();
  const { data: price, isLoading } = useGetPrice(
    location?.countryCode as string,
  );
  const [selectedTier, setSelectedTier] = useState<Tier>(
    lowerCase(price?.products[0].name) as Tier,
  );
  const { data: pricingLimit, isLoading: pricingLimitLoading } =
    usePricingLimit();
  const { data: user } = useUser();
  const proPlanBenefits = useProPlanBenefits(pricingLimit);
  const corePlanBenefits = useCorePlanBenefits(pricingLimit);
  const plusPlanBenefits = usePlusPlanBenefits(pricingLimit);
  const unlimitedPlanBenefits = useUnlimitedPlanBenefits(pricingLimit);

  useEffect(() => {
    setSelectedTier(lowerCase(price?.products[0].name) as Tier);
  }, [price]);

  const { data: upgradeModalEvent } = useUpgradeModalEvent(
    data?.source ? `${data.source}` : "",
    {
      enabled:
        isOpen &&
        error?.status === 402 &&
        !HIGHEST_TIERS.includes(tier as Tier),
    },
  );

  const { data: upgradeLimitFirstReachedTime } =
    useGetUserUpgradeLimitFirstReachedTime({
      enabled:
        user?.user_group?.group === "upgrade_modal_052525" &&
        !!upgradeModalEvent,
    });

  const getPriceForPlan = (
    planName: string,
    period: "monthly" | "quarterly" | "yearly",
  ) => {
    const plan = price?.products?.find((product) =>
      product.name.toLowerCase().includes(planName.toLowerCase()),
    );

    const currencySymbol =
      plan?.monthly?.formatted_price?.replace(/[\d,\.]+/g, "").trim() ||
      plan?.yearly?.formatted_price?.replace(/[\d,\.]+/g, "").trim() ||
      "$";

    if (planName === "Free") {
      return {
        price: 0,
        formatted_price: `${currencySymbol}0`,
      };
    }

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

  const calculateSavePercentage = (planName: string) => {
    const yearlyPrice = getPriceForPlan(planName, "yearly").price;
    const monthlyPrice = getPriceForPlan(planName, "monthly").price;
    return yearlyPrice && monthlyPrice
      ? Math.round((1 - yearlyPrice / monthlyPrice) * 100)
      : 0;
  };

  const handleUpgrade = async () => {
    checkoutSession(
      {
        priceId:
          selectedPlan === "yearly"
            ? price?.products?.find((product) =>
                product.name.toLowerCase().includes(selectedTier.toLowerCase()),
              )?.yearly?.stripe_price_id!
            : selectedPlan === "quarterly"
              ? price?.products?.find((product) =>
                  product.name
                    .toLowerCase()
                    .includes(selectedTier.toLowerCase()),
                )?.quarterly?.stripe_price_id!
              : price?.products?.find((product) =>
                  product.name
                    .toLowerCase()
                    .includes(selectedTier.toLowerCase()),
                )?.monthly?.stripe_price_id!,
        country: location?.countryCode ?? "US",
        tier: selectedTier,
        path: data?.source ? `${data.source}` : "",
      },
      {
        onSuccess: (data) => {
          router.push(data?.url!);
        },
      },
    );
  };

  const subscriberSection = (
    <div className="mt-2 dark:text-neutral-400 text-xs text-neutral-600 flex items-center">
      <div className="flex -space-x-1 mr-2">
        <Image
          className="hidden dark:block w-10 h-10 sm:w-16 sm:h-16 mr-2"
          src="/SubscribersIconDark.png"
          alt={t("upgradeModal.userAvatarAltDark")}
          width={64}
          height={64}
          unoptimized
        />
        <Image
          className="block dark:hidden w-10 h-10 sm:w-16 sm:h-16 mr-2"
          src="/SubscribersIcon.png"
          alt={t("upgradeModal.userAvatarAltLight")}
          width={64}
          height={64}
          unoptimized
        />
      </div>
      <span className="text-sm text-primary/80">
        {t("upgradeModal.joinLearners")}
      </span>
    </div>
  );

  const handleTeamPlanClick = () => {
    closeModal();
    useNormalModalStore.getState().onOpen("teamPricingFormModal");
  };

  const teamPlanSection = (
    <div className="sm:mt-[-10] mb-4 text-center text-xs text-primary/80">
      <span>{t("upgradeModal.needTeamPlan")}</span>{" "}
      <span
        className="text-primary underline cursor-pointer hover:text-primary/90"
        onClick={handleTeamPlanClick}
      >
        {t("upgradeModal.viewTeamOptions")}
      </span>
    </div>
  );

  if (HIGHEST_TIERS.includes(tier as Tier)) {
    return (
      <Modal
        isOpen={isOpen && error?.status === 402}
        onClose={closeModal}
        backdrop="blur"
        placement="center"
        motionProps={{
          variants: {
            enter: {
              y: 0,
              opacity: 1,
              transition: {
                duration: 0.3,
                ease: "easeOut",
              },
            },
            exit: {
              y: -20,
              opacity: 0,
              transition: {
                duration: 0.2,
                ease: "easeIn",
              },
            },
          },
        }}
        classNames={{
          backdrop: "bg-black/50 backdrop-blur-md",
          base: "bg-white dark:bg-neutral-950 py-1 w-full max-w-lg",
          header: "border-b-0 mb-0 pb-0",
          footer: "border-t-0",
          closeButton:
            "hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:bg-transparent hover:text-primary p-1 right-2 top-2",
          body: "pt-0",
        }}
      >
        <TierLimitUpgradeModalContent
          service={error?.service}
          showFeedbackForm={showFeedbackForm}
          setShowFeedbackForm={setShowFeedbackForm}
          closeModal={closeModal}
        />
      </Modal>
    );
  }

  if (isLoading || isTierLoading || pricingLimitLoading || locationLoading)
    return (
      <ModalSkeleton
        isOpen={isOpen && error?.status === 402}
        closeModal={closeModal}
      />
    );

  return (
    <Modal
      isOpen={isOpen && error?.status === 402}
      onClose={closeModal}
      backdrop="blur"
      placement="center"
      motionProps={{
        variants: {
          enter: {
            y: 0,
            opacity: 1,
            transition: {
              duration: 0.3,
              ease: "easeOut",
            },
          },
          exit: {
            y: -20,
            opacity: 0,
            transition: {
              duration: 0.2,
              ease: "easeIn",
            },
          },
        },
      }}
      classNames={{
        backdrop: "bg-black/50 backdrop-blur-md",
        base: "bg-white dark:bg-neutral-950 py-1 sm:max-w-[500px] rounded-3xl",
        header: "border-b-0 mb-0 pb-0",
        footer: "border-t-0",
        closeButton:
          "hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:bg-transparent hover:text-primary p-1 right-2 top-2",
        body: "pt-0",
      }}
    >
      <ModalContent className="border rounded-3xl p-6 pb-6 sm:pb-4 overflow-hidden">
        {(onClose) => (
          <>
            <div className="flex flex-col">
              {/* {tier == "free" && (
                <div className="flex flex-col mt-2">
                  <DiscountTag
                    upgradeLimitFirstReachedTime={
                      upgradeLimitFirstReachedTime?.upgrade_limit_first_reached_at
                    }
                  />
                </div>
              )} */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <ModalHeader className="px-0 sm:px-6 text-2xl font-medium">
                    {fromOnboarding
                      ? t("upgradeModal.unlockFullAccessOnboarding")
                      : t("upgradeModal.unlockFullAccess")}
                  </ModalHeader>
                </div>
                <ModalBody className="p-0">
                  <p className="text-sm text-primary/80 sm:px-6">
                    {t("upgradeModal.unlockFeatureProSubscription")}
                  </p>
                  <Tabs
                    defaultValue={selectedTier}
                    className="focus:ring-white flex flex-col gap-4 focus:outline-none focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 focus-visible:ring-offset-0"
                    onValueChange={(value) => setSelectedTier(value as Tier)}
                  >
                    {price && price?.products?.length > 1 && (
                      <TabsList className="w-fit mx-auto mt-2">
                        {price?.products.map((product) => (
                          <TabsTrigger
                            key={product.name}
                            value={lowerCase(product.name)}
                          >
                            {product.name}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    )}
                    <TabsContent
                      value="plus"
                      className="py-0 px-0 sm:px-6 focus:outline-none focus:ring-0 bg-transparent focus-visible:ring-0 focus:ring-offset-0 focus-visible:ring-offset-0"
                    >
                      <ul className="mb-6 space-y-3 text-sm">
                        {plusPlanBenefits.map((benefit, index) => (
                          <li key={index} className="flex items-start">
                            <Check className="w-5 h-5 mr-2 text-green-500 flex-shrink-0" />
                            <div className="flex flex-wrap gap-1">
                              {benefit.label.split(" ").map((word, index) => {
                                if (word.includes("Learn+")) {
                                  return (
                                    <TooltipProvider
                                      key={index}
                                      delayDuration={0}
                                    >
                                      <Tooltip>
                                        <TooltipTrigger className="underline decoration-dotted">
                                          {word}
                                        </TooltipTrigger>
                                        <TooltipContent
                                          alignOffset={-50}
                                          align="end"
                                        >
                                          {benefit.tooltip}
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  );
                                }
                                return word.toLowerCase() === "unlimited" ||
                                  word.toLowerCase() === "priority" ||
                                  word.toLowerCase() === "10" ||
                                  word.includes("2000") ||
                                  word.includes("50") ||
                                  word.toLowerCase() === "voice" ||
                                  word.toLowerCase() === "mode" ? (
                                  <span key={index} className="font-semibold">
                                    {word}
                                  </span>
                                ) : (
                                  <span key={index}>{word}</span>
                                );
                              })}
                            </div>
                          </li>
                        ))}
                      </ul>
                      <div className="space-y-3">
                        <Button
                          onClick={() => setSelectedPlan("yearly")}
                          variant="outline"
                          className={`text-sm w-full p-4 py-6 border rounded-lg flex justify-between items-center ${
                            selectedPlan === "yearly"
                              ? "border-green-500 bg-green-500/10"
                              : "border-neutral-400 dark:border-neutral-400 text-neutral-500 dark:text-neutral-400"
                          }`}
                        >
                          <span>
                            {t("upgradeModal.annual")}{" "}
                            <span className="ml-1 text-green-500 border-green-500 border px-2 py-1 rounded-full text-xs">
                              {t("priceCard.savePercentage", {
                                save: calculateSavePercentage("plus"),
                              })}
                            </span>
                          </span>
                          <span>
                            {getPriceForPlan("plus", "yearly").formatted_price}{" "}
                            {t("priceCard.billed.monthly")}
                          </span>
                        </Button>
                        {price?.products?.[0]?.quarterly && !isLoading && (
                          <Button
                            onClick={() => setSelectedPlan("quarterly")}
                            variant="outline"
                            className={`text-sm w-full p-4 py-6 rounded-lg flex justify-between items-center ${
                              selectedPlan === "quarterly"
                                ? "border-green-500 bg-green-500/10"
                                : "border-neutral-400 dark:border-neutral-500 text-neutral-600 dark:text-neutral-400"
                            }`}
                          >
                            <span>
                              {t("upgradeModal.quarterly")}{" "}
                              <span className="ml-1 text-green-500 border-green-500 border px-2 py-1 rounded-full text-xs">
                                {t("priceCard.savePercentage", {
                                  save: Math.round(
                                    (1 -
                                      getPriceForPlan("plus", "quarterly")
                                        .price /
                                        getPriceForPlan("plus", "monthly")
                                          .price) *
                                      100,
                                  ),
                                })}
                              </span>
                            </span>
                            <span>
                              {
                                getPriceForPlan("plus", "quarterly")
                                  .formatted_price
                              }{" "}
                              {t("priceCard.billed.monthly")}
                            </span>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          onClick={() => setSelectedPlan("monthly")}
                          className={`text-sm w-full p-4 py-6 rounded-lg flex justify-between items-center ${
                            selectedPlan === "monthly"
                              ? "border-green-500 bg-green-500/10"
                              : "border-neutral-400 dark:border-neutral-400 text-neutral-500 dark:text-neutral-400"
                          }`}
                        >
                          <span>{t("upgradeModal.monthly")}</span>
                          <span>
                            {getPriceForPlan("plus", "monthly").formatted_price}{" "}
                            {t("priceCard.billed.monthly")}
                          </span>
                        </Button>
                        <Button
                          disabled={isPending}
                          onClick={handleUpgrade}
                          className="text-sm w-full p-4 py-6 bg-green-500 rounded-lg bg-primary text-primary-foreground font-semibold"
                        >
                          {isPending ? (
                            <Spinner />
                          ) : price?.products?.find((product) =>
                              product.name.toLowerCase().includes("plus"),
                            )?.[selectedPlan]?.metadata?.trial_period_days ? (
                            t("upgrade.freeTrial", {
                              day: price?.products?.find((product) =>
                                product.name.toLowerCase().includes("plus"),
                              )?.[selectedPlan]?.metadata?.trial_period_days,
                            })
                          ) : (
                            t("upgrade.proPlan.buttonText")
                          )}
                        </Button>
                      </div>
                      {subscriberSection}
                      {teamPlanSection}
                    </TabsContent>
                    <TabsContent
                      value="unlimited"
                      className="py-0 px-0 sm:px-6 focus:outline-none focus:ring-0 bg-transparent focus-visible:ring-0 focus:ring-offset-0 focus-visible:ring-offset-0"
                    >
                      <ul className="mb-6 space-y-3 text-sm">
                        {unlimitedPlanBenefits.map((benefit, index) => (
                          <li key={index} className="flex items-start">
                            <Check className="w-5 h-5 mr-2 text-green-500 flex-shrink-0" />
                            <div className="flex flex-wrap gap-1">
                              {benefit.label.split(" ").map((word, index) => {
                                if (word.includes("Learn+")) {
                                  return (
                                    <TooltipProvider
                                      key={index}
                                      delayDuration={0}
                                    >
                                      <Tooltip>
                                        <TooltipTrigger className="underline decoration-dotted">
                                          {word}
                                        </TooltipTrigger>
                                        <TooltipContent
                                          alignOffset={-50}
                                          align="end"
                                        >
                                          {benefit.tooltip}
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  );
                                }
                                return word.toLowerCase() === "unlimited" ||
                                  word.toLowerCase() === "priority" ||
                                  word.toLowerCase() === "10" ||
                                  word.includes("2000") ||
                                  word.includes("50") ||
                                  word.toLowerCase() === "voice" ||
                                  word.toLowerCase() === "mode" ? (
                                  <span key={index} className="font-semibold">
                                    {word}
                                  </span>
                                ) : (
                                  <span key={index}>{word}</span>
                                );
                              })}
                            </div>
                          </li>
                        ))}
                      </ul>
                      <div className="space-y-3">
                        <Button
                          onClick={() => setSelectedPlan("yearly")}
                          variant="outline"
                          className={`text-sm w-full p-4 py-6 border rounded-lg flex justify-between items-center ${
                            selectedPlan === "yearly"
                              ? "border-green-500 bg-green-500/10"
                              : "border-neutral-400 dark:border-neutral-500 text-neutral-600 dark:text-neutral-400"
                          }`}
                        >
                          <span>
                            {t("upgradeModal.annual")}{" "}
                            <span className="ml-1 text-green-500 border-green-500 border px-2 py-1 rounded-full text-xs">
                              {t("priceCard.savePercentage", {
                                save: calculateSavePercentage("unlimited"),
                              })}
                            </span>
                          </span>
                          <span>
                            {
                              getPriceForPlan("unlimited", "yearly")
                                .formatted_price
                            }{" "}
                            {t("priceCard.billed.monthly")}
                          </span>
                        </Button>
                        {price?.products?.[0]?.quarterly && !isLoading && (
                          <Button
                            onClick={() => setSelectedPlan("quarterly")}
                            variant="outline"
                            className={`text-sm w-full p-4 py-6 rounded-lg flex justify-between items-center ${
                              selectedPlan === "quarterly"
                                ? "border-green-500 bg-green-500/10"
                                : "border-neutral-400 dark:border-neutral-500 text-neutral-600 dark:text-neutral-400"
                            }`}
                          >
                            <span>
                              {t("upgradeModal.quarterly")}{" "}
                              <span className="ml-1 text-green-500 border-green-500 border px-2 py-1 rounded-full text-xs">
                                {t("priceCard.savePercentage", {
                                  save: Math.round(
                                    (1 -
                                      getPriceForPlan("unlimited", "quarterly")
                                        .price /
                                        getPriceForPlan("unlimited", "monthly")
                                          .price) *
                                      100,
                                  ),
                                })}
                              </span>
                            </span>
                            <span>
                              {
                                getPriceForPlan("unlimited", "quarterly")
                                  .formatted_price
                              }{" "}
                              {t("priceCard.billed.monthly")}
                            </span>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          onClick={() => setSelectedPlan("monthly")}
                          className={`text-sm w-full p-4 py-6 rounded-lg flex justify-between items-center ${
                            selectedPlan === "monthly"
                              ? "border-green-500 bg-green-500/10"
                              : "border-neutral-400 dark:border-neutral-500 text-neutral-600 dark:text-neutral-400"
                          }`}
                        >
                          <span>{t("upgradeModal.monthly")}</span>
                          <span>
                            {
                              getPriceForPlan("unlimited", "monthly")
                                .formatted_price
                            }{" "}
                            {t("priceCard.billed.monthly")}
                          </span>
                        </Button>
                        <Button
                          disabled={isPending}
                          onClick={handleUpgrade}
                          className="text-sm w-full p-4 py-6 bg-green-500 rounded-lg bg-primary text-primary-foreground font-semibold"
                        >
                          {isPending ? (
                            <Spinner />
                          ) : price?.products?.find((product) =>
                              product.name.toLowerCase().includes("unlimited"),
                            )?.[selectedPlan]?.metadata?.trial_period_days ? (
                            t("upgrade.freeTrial", {
                              day: price?.products?.find((product) =>
                                product.name
                                  .toLowerCase()
                                  .includes("unlimited"),
                              )?.[selectedPlan]?.metadata?.trial_period_days,
                            })
                          ) : (
                            t("upgrade.proPlan.buttonText")
                          )}
                        </Button>
                      </div>
                      {subscriberSection}
                      {teamPlanSection}
                    </TabsContent>
                    <TabsContent
                      value="pro"
                      className="py-0 px-0 sm:px-6 focus:outline-none focus:ring-0 bg-transparent focus-visible:ring-0 focus:ring-offset-0 focus-visible:ring-offset-0"
                    >
                      <ul className="mb-6 space-y-3 text-sm">
                        {proPlanBenefits.map((benefit, index) => (
                          <li key={index} className="flex items-start">
                            <Check className="w-5 h-5 mr-2 text-green-500 flex-shrink-0" />
                            <div className="flex flex-wrap gap-1">
                              {benefit.label.split(" ").map((word, index) => {
                                if (word.includes("Learn+")) {
                                  return (
                                    <TooltipProvider
                                      key={index}
                                      delayDuration={0}
                                    >
                                      <Tooltip>
                                        <TooltipTrigger className="underline decoration-dotted">
                                          {word}
                                        </TooltipTrigger>
                                        <TooltipContent
                                          alignOffset={-50}
                                          align="end"
                                        >
                                          {benefit.tooltip}
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  );
                                }
                                return word.toLowerCase() === "unlimited" ||
                                  word.toLowerCase() === "priority" ||
                                  word.toLowerCase() === "10" ||
                                  word.includes("2000") ||
                                  word.includes("50") ||
                                  word.toLowerCase() === "voice" ||
                                  word.toLowerCase() === "mode" ? (
                                  <span key={index} className="font-semibold">
                                    {word}
                                  </span>
                                ) : (
                                  <span key={index}>{word}</span>
                                );
                              })}
                            </div>
                          </li>
                        ))}
                      </ul>
                      <div className="space-y-3">
                        <Button
                          onClick={() => setSelectedPlan("yearly")}
                          variant="outline"
                          className={`text-sm w-full p-4 py-6 border rounded-lg flex justify-between items-center ${
                            selectedPlan === "yearly"
                              ? "border-green-500 bg-green-500/10"
                              : "border-neutral-400 dark:border-neutral-500 text-neutral-600 dark:text-neutral-400"
                          }`}
                        >
                          <span>
                            {t("upgradeModal.annual")}{" "}
                            <span className="ml-1 text-green-500 border-green-500 border px-2 py-1 rounded-full text-xs">
                              {t("priceCard.savePercentage", {
                                save: calculateSavePercentage("pro"),
                              })}
                            </span>
                          </span>
                          <span>
                            {getPriceForPlan("pro", "yearly").formatted_price}{" "}
                            {t("priceCard.billed.monthly")}
                          </span>
                        </Button>
                        {price?.products?.[0]?.quarterly && !isLoading && (
                          <Button
                            onClick={() => setSelectedPlan("quarterly")}
                            variant="outline"
                            className={`text-sm w-full p-4 py-6 rounded-lg flex justify-between items-center ${
                              selectedPlan === "quarterly"
                                ? "border-green-500 bg-green-500/10"
                                : "border-neutral-400 dark:border-neutral-500 text-neutral-600 dark:text-neutral-400"
                            }`}
                          >
                            <span>
                              {t("upgradeModal.quarterly")}{" "}
                              <span className="ml-1 text-green-500 border-green-500 border px-2 py-1 rounded-full text-xs">
                                {t("priceCard.savePercentage", {
                                  save: Math.round(
                                    (1 -
                                      getPriceForPlan("pro", "quarterly")
                                        .price /
                                        getPriceForPlan("pro", "monthly")
                                          .price) *
                                      100,
                                  ),
                                })}
                              </span>
                            </span>
                            <span>
                              {
                                getPriceForPlan("pro", "quarterly")
                                  .formatted_price
                              }{" "}
                              {t("priceCard.billed.monthly")}
                            </span>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          onClick={() => setSelectedPlan("monthly")}
                          className={`text-sm w-full p-4 py-6 rounded-lg flex justify-between items-center ${
                            selectedPlan === "monthly"
                              ? "border-green-500 bg-green-500/10"
                              : "border-neutral-400 dark:border-neutral-500 text-neutral-600 dark:text-neutral-400"
                          }`}
                        >
                          <span>{t("upgradeModal.monthly")}</span>
                          <span>
                            {getPriceForPlan("pro", "monthly").formatted_price}{" "}
                            {t("priceCard.billed.monthly")}
                          </span>
                        </Button>
                        <Button
                          disabled={isPending}
                          onClick={handleUpgrade}
                          className="text-sm w-full p-4 py-6 bg-green-500 rounded-lg bg-primary text-primary-foreground font-semibold"
                        >
                          {isPending ? (
                            <Spinner />
                          ) : price?.products?.find((product) =>
                              product.name.toLowerCase().includes("pro"),
                            )?.[selectedPlan]?.metadata?.trial_period_days ? (
                            t("upgrade.freeTrial", {
                              day: price?.products?.find((product) =>
                                product.name.toLowerCase().includes("pro"),
                              )?.[selectedPlan]?.metadata?.trial_period_days,
                            })
                          ) : (
                            t("upgrade.proPlan.buttonText")
                          )}
                        </Button>
                      </div>
                      {subscriberSection}
                      {teamPlanSection}
                    </TabsContent>
                  </Tabs>
                </ModalBody>
              </div>
            </div>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default UpgradeModal;
