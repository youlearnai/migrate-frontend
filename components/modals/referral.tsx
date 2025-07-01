import {
  useGenerateReferralCode,
  useGetReferralCode,
} from "@/query-hooks/referral";
import React, { useState } from "react";
import { useCopyToClipboard } from "usehooks-ts";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Check, Copy, Gift, Users, Info } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Skeleton } from "../ui/skeleton";

interface ReferralProps {
  hideLink?: boolean;
}

const Referral = ({ hideLink = false }: ReferralProps) => {
  const { t } = useTranslation();
  const { data: referralCode, isLoading: isLoadingReferralCode } =
    useGetReferralCode();
  const { mutate: generateReferralCode, isPending: isGenerating } =
    useGenerateReferralCode();
  const [_, copy] = useCopyToClipboard();
  const [isCopied, setIsCopied] = useState(false);

  const handleGenerateReferralCode = () => {
    generateReferralCode(undefined, {
      onSuccess: (newCode) => {
        const referralLink = `${window.location.origin}/signup?referralCode=${newCode.code}`;
        copy(referralLink)
          .then(() => {
            setIsCopied(true);
            toast.success(t("shareSpace.copiedToastMessage"));
            setTimeout(() => setIsCopied(false), 1000);
          })
          .catch((error) => {
            toast.error(t("signIn.form.unknownError"));
          });
      },
    });
  };

  const handleCopyReferralLink = async () => {
    if (!referralCode?.code) return;
    const referralLink = `${window.location.origin}/signup?referralCode=${referralCode.code}`;
    try {
      await copy(referralLink);
      setIsCopied(true);
      toast.success(t("shareSpace.copiedToastMessage"));
      setTimeout(() => setIsCopied(false), 1000);
    } catch (error) {
      toast.error(t("signIn.form.unknownError"));
    }
  };

  // total people who have used the referral code
  const getTotalUsers = () => {
    return referralCode?.redemptions?.length || 0;
  };

  if (isLoadingReferralCode) {
    return null;
  }

  const referralLink = referralCode?.code
    ? `${window.location.origin}/signup?referralCode=${referralCode.code}`
    : `${window.location.origin}/signup?referralCode=`;

  return (
    <Card className="w-full mx-auto shadow-none border-none">
      <CardHeader className="py-2 px-0 sm:px-6 sm:pt-6 sm:pb-4">
        <CardTitle className="flex items-center justify-start mb-1">
          <div className="flex items-center gap-2 text-base font-medium mr-2">
            <span>{t("referral.referralProgram")}</span>
          </div>
          {referralCode?.code && (
            <Badge
              variant="secondary"
              className="whitespace-nowrap font-medium"
            >
              <Users className="h-3 w-3 mr-1" />
              {getTotalUsers()} {t("referral.signUps")}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {t("referral.description")}
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Info className="inline-block h-3.5 w-3.5 text-muted-foreground cursor-help ml-1 mb-0.5" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px] text-muted-foreground">
                <p>{t("referral.tooltip")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        <div className="flex items-center gap-2">
          {!hideLink && (
            <div className="bg-muted p-2 rounded-md flex-1 truncate text-sm select-none text-muted-foreground">
              {referralLink}
            </div>
          )}
          <Button
            variant="outline"
            className={hideLink ? "w-full" : "whitespace-nowrap"}
            disabled={isGenerating || isCopied}
            onClick={
              referralCode?.code
                ? handleCopyReferralLink
                : handleGenerateReferralCode
            }
          >
            {isGenerating
              ? t("referral.generating")
              : isCopied
                ? t("referral.copied")
                : t("referral.copyLink")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Referral;
