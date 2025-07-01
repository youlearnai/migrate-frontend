import { PriceCardProps } from "@/lib/types";
import { cn } from "@/lib/utils";
import React from "react";
import { useTranslation } from "react-i18next";
import Spinner from "../global/spinner";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { ArrowRight } from "lucide-react";

const PriceCard = ({
  plan,
  price,
  subTitle,
  planBenefits,
  buttonText,
  buttonStyle,
  handleClick,
  billingPeriod,
  highlight,
  savePercentage,
  isLoading,
  isProcessing,
  currency,
  freeTrialDays,
  bgColor,
  textColor,
  skeletonColor,
  borderColor,
  isPopular,
}: PriceCardProps) => {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "relative max-w-[320px] flex flex-col justify-between col-span-1 rounded-[32px] p-8 text-left overflow-hidden",
        bgColor,
        textColor,
        borderColor,
      )}
    >
      <div className="mb-6 space-y-4">
        <div className="">
          <div className="flex items-center gap-2">
            <h1 className={cn("text-md font-light")}>
              {isLoading || (price === 0 && plan !== "Free") ? (
                <div className="h-6 w-24 animate-pulse rounded" />
              ) : (
                <span className="font-medium">
                  {plan}{" "}
                  {plan !== "Free" && plan !== "Team" && (
                    <span className="text-sm">
                      {billingPeriod === "year"
                        ? "(billed annually)"
                        : "(billed monthly)"}
                    </span>
                  )}
                </span>
              )}
            </h1>
            {/* {isPopular && (
              <div className="dark:text-[#3CB371] text-[#3CB371] text-xs rounded-full px-2 py-0.5 font-medium bg-gradient-to-b from-[#3CB371]/10 to-[#3CB371]/5 dark:from-[#3CB371]/20 dark:to-[#3CB371]/5 backdrop-blur-sm border-t-[0.5px] border-l-[0.5px] border-r-[0.25px] border-b-[0.5px] border-[#3CB371]/50 dark:border-[#3CB371] z-20">
                {isPopular}
              </div>
            )} */}
          </div>
        </div>
        <div className="">
          <div className="flex flex-row w-full justify-start gap-1 items-end">
            {plan !== "Team" && (
              <div>
                <span className="text-5xl space-x-1.5">
                  {isLoading || (price === 0 && plan !== "Free") ? (
                    <div className="h-8 w-20 animate-pulse rounded" />
                  ) : (
                    <>
                      <span className="font-light">
                        {currency.replace(/[\d,\.]+/g, "").trim()}
                      </span>
                      <span className="font-normal">
                        {currency.match(/[\d,\.]+/)?.[0] || "0"}
                      </span>
                    </>
                  )}
                </span>
                <span className="font-light lg:text-[18px] text-[15px] opacity-70">
                  {" "}
                  {t("priceCard.billed.monthly")}
                </span>
              </div>
            )}
            {plan === "Team" && (
              <div>
                <span className="text-5xl capitalize space-x-1.5">
                  <span>{t("custom")}</span>
                </span>
              </div>
            )}

            {/* {!!price && billingPeriod == "year" && plan !== "Core" && (
              <div
                className={`justify-start h-min text-xs dark:text-black uppercase font-normal p-1 rounded-lg ml-2 zoom-jiggle text-emerald-400`}
              >
                {isLoading || (price === 0 && plan !== "Free") ? (
                  <div className="h-4 w-16 bg-emerald-200 animate-pulse rounded" />
                ) : (
                  t("priceCard.savePercentage", { save: savePercentage })
                )}
              </div>
            )} */}
          </div>
          <div className={cn("lg:text-[15px] mt-4", textColor)}>{subTitle}</div>
          <div className="flex flex-row w-full justify-start gap-1 mt-1.5 items-end">
            {freeTrialDays && (
              <span className="lg:text-md dark:text-neutral-900 font-medium">
                *
                {t("upgrade.freeTrial", {
                  day: freeTrialDays,
                })}
              </span>
            )}
          </div>
          <div className="w-full h-[.5px] bg-neutral-600 dark:bg-neutral-400 my-4" />
        </div>
        <div className={cn("flex flex-col min-h-[280px]")}>
          {!isLoading ? (
            planBenefits.map((benefit, index) => (
              <div
                className="flex flex-row w-full items-start justify-left"
                key={index}
              >
                <div className="flex-shrink-0 mt-1">{benefit.icon}</div>
                <div className="flex-1 flex items-start">
                  {!!price ? (
                    <span className="mb-2 text-sm leading-6">
                      {benefit.label.split(" ").map((word, index) => {
                        if (word.includes("Learn+")) {
                          return (
                            <React.Fragment key={index}>
                              <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                  <TooltipTrigger className="underline decoration-dotted">
                                    {word}
                                  </TooltipTrigger>
                                  <TooltipContent sideOffset={5}>
                                    {benefit.tooltip}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>{" "}
                            </React.Fragment>
                          );
                        }
                        return (
                          <React.Fragment key={index}>
                            {word.toLowerCase() === "unlimited" ||
                            word.toLowerCase() === "priority" ||
                            word.toLowerCase() === "10" ||
                            word.includes("2000") ||
                            word.includes("50") ||
                            word.toLowerCase() === "flexible" ||
                            word.toLowerCase() === "centralized" ||
                            word.toLowerCase() === "collaborative" ||
                            word.toLowerCase() === "add" ||
                            word.toLowerCase() === "shared" ||
                            word.toLowerCase() === "everything" ||
                            word.toLowerCase() === "custom" ||
                            word.toLowerCase() === "in" ||
                            word.toLowerCase() === "pro" ||
                            word.toLowerCase() === "+" ||
                            word.toLowerCase() === "voice" ||
                            word.toLowerCase() === "mode" ? (
                              <span className="font-semibold">{word} </span>
                            ) : (
                              word
                            )}{" "}
                          </React.Fragment>
                        );
                      })}
                    </span>
                  ) : (
                    <span className="mb-2 text-sm leading-relaxed">
                      {benefit.label.split(" ").map((word, index) => {
                        if (word.includes("Learn+")) {
                          return (
                            <React.Fragment key={index}>
                              <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                  <TooltipTrigger className="underline decoration-dotted">
                                    {word}
                                  </TooltipTrigger>
                                  <TooltipContent sideOffset={5}>
                                    {benefit.tooltip}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>{" "}
                            </React.Fragment>
                          );
                        }
                        return (
                          <React.Fragment key={index}>
                            {word.toLowerCase() === "unlimited" ||
                            word.toLowerCase() === "priority" ||
                            word.includes("2000") ||
                            word.includes("50") ||
                            word.toLowerCase() === "voice" ||
                            word.toLowerCase() === "mode" ? (
                              <span className="font-semibold">{word} </span>
                            ) : (
                              word
                            )}{" "}
                          </React.Fragment>
                        );
                      })}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col gap-2 h-full">
              <Skeleton className={cn("h-7 w-full", skeletonColor)} />
              <Skeleton className={cn("h-7 w-full", skeletonColor)} />
              <Skeleton className={cn("h-7 w-full", skeletonColor)} />
              <Skeleton className={cn("h-7 w-full", skeletonColor)} />
              <Skeleton className={cn("h-7 w-full", skeletonColor)} />
            </div>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        className={buttonStyle}
        onClick={handleClick}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <Spinner />
        ) : (
          <div className="flex items-center justify-center">
            <span className={plan === "Pro" ? "font-medium" : ""}>
              {t("priceCard.buttonText", { buttonText })}
            </span>
            {plan === "Pro" && <ArrowRight className="ml-2 h-4 w-4" />}
          </div>
        )}
      </Button>
    </div>
  );
};

export default PriceCard;
