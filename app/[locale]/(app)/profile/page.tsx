"use client";
import PersonalizedForm, {
  PersonalizedFormSchemaType,
} from "@/components/global/personalized-form";
import Spinner from "@/components/global/spinner";
import Referral from "@/components/modals/referral";
import { ImageUpload } from "@/components/profile/image-upload";
import Streaks from "@/components/profile/streaks";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useAuth from "@/hooks/use-auth";
import { useModalStore } from "@/hooks/use-modal-store";
import {
  useGetTier,
  usePortalLink,
  useUpdateUser,
  useUser,
  usePauseSubscription,
  useResumeSubscription,
} from "@/query-hooks/user";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CreditCard, XCircle, PauseCircle, PlayCircle } from "lucide-react";
import { PAID_TIERS } from "@/lib/utils";
import { Tier } from "@/lib/types";

const ProfilePage = () => {
  const router = useRouter();
  const { onOpen } = useModalStore();
  const [isOpen, setIsOpen] = useState<string | null>(null);
  const { user, loading } = useAuth();
  const { data: userData } = useUser();
  const { mutate: updateUser } = useUpdateUser();
  const { mutate: getPortal, isPending: isPortalPending } = usePortalLink();
  const { mutate: pauseSubscription, isPending: isPausing } =
    usePauseSubscription();
  const { mutate: resumeSubscription, isPending: isResuming } =
    useResumeSubscription();
  const { t } = useTranslation();
  const { data: tier } = useGetTier();

  const isPausedSubscription =
    userData?.customer?.subscription?.is_paused === true;
  const resumesAt = userData?.customer?.subscription?.resumes_at
    ? new Date(userData.customer.subscription.resumes_at)
    : null;

  const handleCancelSubscription = () => {
    onOpen("pauseSubscriptionPrompt");
  };

  const handleSubscriptions = async () => {
    getPortal(undefined, {
      onSuccess: (data) => router.push(data?.url!),
    });
  };

  const handlePauseSubscription = () => {
    onOpen("pauseSubscription");
  };

  const handleResumeSubscription = () => {
    resumeSubscription(undefined);
  };

  function formatCreationDate(creationTime: string) {
    if (!creationTime) return t("profile.dateNotAvailable");
    return format(new Date(creationTime), "dd MMMM, yyyy");
  }

  const handleSubmit = (data: PersonalizedFormSchemaType) => {
    updateUser({
      fullName: data.name!,
      educationLevel: userData?.user_profile.education_level || "",
      photoURL: userData?.user_profile.photo_url!,
      interests: userData?.user_profile.interests || [],
      language: data.language!.toLocaleLowerCase(),
      chatModelId: data.aiModel,
      purpose: data.purpose,
      purposeDetail: data.purposeDetail,
      referralSource: data.referralSource,
      otherReferralSource: data.otherReferralSource,
    });
    setIsOpen(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      let reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          updateUser({
            educationLevel: userData?.user_profile.education_level!,
            photoURL: e.target.result as string,
            interests: userData?.user_profile.interests,
            language: userData?.user_profile.language!,
            chatModelId: userData?.user_profile.chat_model_id!,
            purpose: userData?.user_profile.purpose,
            referralSource: userData?.user_profile.referral_source,
            otherReferralSource: userData?.user_profile.other_referral_source,
          });
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  if (loading) return null;

  return (
    <div className="flex flex-col lg:mt-2" key="profile-page-root">
      <div
        className="flex flex-col lg:flex-row lg:justify-between lg:space-x-4 space-x-0 space-y-4 lg:space-y-0"
        key="profile-content"
      >
        <div className="flex flex-col space-y-2 lg:w-[35%]" key="profile-main">
          <div className="flex mt-4 flex-row lg:w-[65%]" key="profile-header">
            <ImageUpload
              key="profile-image"
              image={userData?.user_profile.photo_url!}
              onChange={handleImageChange}
            />
            <div className="flex flex-col ml-6" key="profile-info">
              <span
                className="text-xl lg:max-w-[200px] max-w-[300px] truncate"
                key="display-name"
              >
                {user?.displayName}
              </span>
              <span className="text-sm text-primary/90 my-2" key="email">
                {user?.email}
              </span>
              <h2 className="text-sm text-primary/90" key="creation-date">
                {t("profile.dateCreated")}{" "}
                {formatCreationDate(user?.metadata?.creationTime!)}
              </h2>
            </div>
          </div>
          <Accordion
            type="single"
            collapsible
            value={isOpen as string}
            onValueChange={(value) => setIsOpen(value)}
            key="profile-accordion"
          >
            <AccordionItem value="item-1" key="edit-profile-item">
              <AccordionTrigger className="w-full" key="edit-profile-trigger">
                <div
                  className="flex w-full mr-4 items-center justify-between"
                  key="edit-button-container"
                >
                  <div
                    className="inline-flex h-11 w-full items-center justify-center whitespace-nowrap rounded-lg border border-input bg-background px-8 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                    key="edit-button"
                  >
                    {t("profile.editProfile")}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="mt-2 mx-1" key="edit-form-content">
                <PersonalizedForm
                  key="personalized-form"
                  handleSubmit={handleSubmit}
                  isNewUser={false}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        <div
          className="rounded-lg w-full lg:h-[205px] border"
          key="streaks-container"
        >
          <Streaks key="streaks-component" />
        </div>
      </div>

      <div className="mt-4">
        {isPausedSubscription && (
          <div className="flex flex-row items-center max-w-full lg:max-w-[26%] lg:min-w-[268px] flex-wrap gap-2 justify-between mb-3 p-4 border rounded-lg bg-white dark:bg-black">
            <div className="text-sm">
              <span className="font-medium text-base text-primary/90 flex items-center">
                {t("profile.subscriptionPaused")}
              </span>
              <p className="mt-1 text-primary/80">
                {resumesAt
                  ? t("profile.subscriptionPausedResumesOn", {
                      date: format(resumesAt, "dd MMMM, yyyy"),
                    })
                  : t("profile.subscriptionPausedIndefinitely")}
              </p>
            </div>
            <Button
              onClick={handleResumeSubscription}
              disabled={isResuming}
              size="sm"
              className="flex items-center gap-2"
            >
              {isResuming ? (
                <Spinner />
              ) : (
                <>
                  <PlayCircle className="h-4 w-4" />
                  {t("profile.resumeSubscription")}
                </>
              )}
            </Button>
          </div>
        )}

        {tier === "free" && (
          <div className="max-w-full lg:max-w-[26%] lg:min-w-[268px] mt-3 border rounded-lg pt-4 px-4 md:px-0 md:pt-0">
            <Referral hideLink={true} />
          </div>
        )}

        <DropdownMenu>
          {PAID_TIERS.includes(tier as Tier) && (
            <DropdownMenuTrigger asChild>
              <Button variant="link" className="w-fit pl-0">
                {t("profile.manageSubscriptions")}
              </Button>
            </DropdownMenuTrigger>
          )}
          <DropdownMenuContent className="w-fit mr-4 rounded-xl p-3">
            <DropdownMenuItem
              onClick={handleSubscriptions}
              disabled={isPortalPending || isPausing || isResuming}
              className="flex items-center gap-2 p-3"
            >
              {isPortalPending ? (
                <Spinner />
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  {t("profile.viewPlan")}
                </>
              )}
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={handleCancelSubscription}
              disabled={isPortalPending || isPausing || isResuming}
              className="flex items-center gap-2 p-3"
            >
              {isPortalPending ? (
                <Spinner />
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  {t("profile.cancelSubscription")}
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Button
        key="delete-account-button"
        onClick={() => onOpen("accountDelete")}
        variant="link"
        className="px-0 w-fit"
      >
        {t("profile.deleteAccount")}
      </Button>
    </div>
  );
};

export default ProfilePage;
