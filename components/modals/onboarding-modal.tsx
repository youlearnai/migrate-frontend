"use client";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useModalStore } from "@/hooks/use-modal-store";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Step } from "@/lib/types";
import Spinner from "@/components/global/spinner";
import { useErrorStore } from "@/hooks/use-error-store";
import { useUser } from "@/query-hooks/user";

const useSteps = (): Step[] => {
  const { t } = useTranslation();

  return [
    {
      title: t("onboarding.steps.welcome.title"),
      description: t("onboarding.steps.welcome.description"),
    },
    {
      title: t("onboarding.steps.upload.title"),
      description: (
        <>
          {t("onboarding.steps.upload.description2")}{" "}
          <span className="text-green-500 dark:text-[#7DFF97]">
            <button
              onClick={() =>
                window.open(
                  "https://chromewebstore.google.com/detail/kchofibfnlabofiejaeodpgnhhcajjlj?utm_source=item-share-cb",
                  "_blank",
                )
              }
              className="hover:underline font-medium"
            >
              {t("header.chromeExtension")}
            </button>
          </span>
          .
        </>
      ),
      tabs: [
        {
          label: t("onboarding.steps.upload.tabs.upload"),
          media:
            "https://dj2sofb25vegx.cloudfront.net/signup_modal/upload_pdf.mp4",
          mediaType: "video",
        },
        {
          label: t("onboarding.steps.upload.tabs.paste"),
          media:
            "https://dj2sofb25vegx.cloudfront.net/signup_modal/upload_youtube_video.mp4",
          mediaType: "video",
        },
        {
          label: t("onboarding.steps.upload.tabs.record"),
          media:
            "https://dj2sofb25vegx.cloudfront.net/signup_modal/record_lecture.mp4",
          mediaType: "video",
        },
      ],
    },
    {
      title: t("onboarding.steps.chat.title"),
      description: t("onboarding.steps.chat.description"),
      media:
        "https://dj2sofb25vegx.cloudfront.net/signup_modal/chat_with_ai_copilot.mp4",
      mediaType: "video",
    },
    // {
    //   title: t("onboarding.steps.chat.title"),
    //   description: t("onboarding.steps.chat.description"),
    //   media:
    //     "https://dj2sofb25vegx.cloudfront.net/signup_modal/chat_with_ai_copilot.mp4",
    //   mediaType: "video",
    // },
    // {
    //   title: t("onboarding.steps.flashcards.title"),
    //   description: t("onboarding.steps.flashcards.description"),
    //   media:
    //     "https://dj2sofb25vegx.cloudfront.net/signup_modal/flashcards.mp4",
    //   mediaType: "video",
    // },
    // {
    //   title: t("onboarding.steps.generate.title"),
    //   description: t("onboarding.steps.generate.description"),
    //   media:
    //     "https://dj2sofb25vegx.cloudfront.net/signup_modal/chapters_transcripts_summary.mp4",
    //   mediaType: "video",
    // },
    {
      title: t("onboarding.steps.quizzes.title"),
      description: t("onboarding.steps.quizzes.description"),
      media: "https://dj2sofb25vegx.cloudfront.net/signup_modal/quizzes.mp4",
      mediaType: "video",
    },
    {
      title: t("onboarding.steps.exam.title"),
      description: t("onboarding.steps.exam.description"),
      media: "https://dj2sofb25vegx.cloudfront.net/signup_modal/exam.mp4",
      mediaType: "video",
    },
    {
      title: t("onboarding.steps.quickGuide.title"),
      description: t("onboarding.steps.quickGuide.description"),
      media: "/QuickGuide.png",
      mediaType: "image",
    },
    // {
    //   title: t("onboarding.steps.spaces.title"),
    //   description: t("onboarding.steps.spaces.description"),
    //   media:
    //     "https://dj2sofb25vegx.cloudfront.net/signup_modal/space_space_chat.mp4",
    //   mediaType: "video",
    // },
    // {
    //   title: t("onboarding.steps.share.title"),
    //   description: t("onboarding.steps.share.description"),
    //   media:
    //     "https://dj2sofb25vegx.cloudfront.net/signup_modal/share_space.mp4",
    //   mediaType: "video",
    // },
  ];
};

export default function OnboardingModal() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { isOpen, onClose, type, onOpen, data } = useModalStore();
  const { openModal } = useErrorStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const steps = useSteps();
  const [videoEnded, setVideoEnded] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const { data: user } = useUser();

  const isModalOpen = isOpen && type === "onboarding";

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem("guideClicked", "true");
      handleClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleClose();
  };

  const handleClose = () => {
    onClose();
    if (data.showUpgradeModal) {
      setTimeout(() => {
        openModal(
          {
            status: 402,
            statusText: "Upgrade to continue",
          },
          {
            source: `onboarding-modal-signup_modal_061425`,
          },
        );
      }, 1000);
    }
  };

  const handleDotClick = (index: number) => {
    setCurrentStep(index);
  };

  useEffect(() => {
    const shouldShowOnboarding = localStorage.getItem("showOnboarding");
    const isNewUser = localStorage.getItem("newUser");

    const isAuthPage =
      pathname.includes("/signin") ||
      pathname.includes("/signup") ||
      pathname.includes("/verify") ||
      pathname.includes("/personal-form");

    if (
      user &&
      shouldShowOnboarding === "true" &&
      isNewUser === "true" &&
      !isAuthPage
    ) {
      localStorage.removeItem("newUser");
      localStorage.removeItem("showOnboarding");
      setCurrentStep(0);
      onOpen("onboarding", {
        showUpgradeModal: user?.user_group?.group === "signup_modal_061425",
      });
    }
  }, [pathname, onOpen, user]);

  useEffect(() => {
    const currentStepTabs = steps[currentStep]?.tabs;
    if (videoEnded && currentStepTabs) {
      if (activeTab < currentStepTabs.length - 1) {
        setActiveTab(activeTab + 1);
      }
      setVideoEnded(false);
    }
  }, [videoEnded, activeTab, currentStep, steps]);

  useEffect(() => {
    setIsVideoLoading(true);
  }, [currentStep, activeTab]);

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent
        className={`${
          steps[currentStep]?.mediaType || steps[currentStep]?.tabs
            ? "sm:max-w-[425px] md:max-w-[600px] lg:max-w-[700px]"
            : "sm:max-w-[425px] md:max-w-[550px]"
        }`}
      >
        <div className="flex flex-col items-center">
          <DialogTitle className="text-xl md:text-2xl mb-2 w-full text-left">
            {steps[currentStep]?.title}
          </DialogTitle>
          <p className="text-muted-foreground md:text-base w-full text-left">
            {steps[currentStep]?.description}
          </p>

          {steps[currentStep]?.tabs && (
            <div className="w-full mt-4">
              <div className="flex space-x-2 mb-4">
                {steps[currentStep]?.tabs?.map((tab, index) => (
                  <Button
                    key={tab.label}
                    variant={activeTab === index ? "default" : "outline"}
                    onClick={() => setActiveTab(index)}
                    className="flex-1"
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>

              <div className="mt-2 relative w-full h-[220px] sm:h-[240px] md:h-[340px] lg:h-[400px] border-2 border-primary/20 rounded-lg bg-muted">
                {isVideoLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted z-10 rounded-lg">
                    <Spinner className="w-8 h-8" />
                  </div>
                )}
                <video
                  className="w-full h-full rounded-md object-cover"
                  src={steps[currentStep]?.tabs?.[activeTab]?.media}
                  poster="/video-placeholder.png"
                  autoPlay
                  muted
                  loop={false}
                  playsInline
                  onLoadedData={() => setIsVideoLoading(false)}
                  onEnded={() => setVideoEnded(true)}
                />
              </div>
            </div>
          )}

          {!steps[currentStep]?.tabs &&
            steps[currentStep]?.mediaType === "video" && (
              <div className="mt-4 relative w-full h-[220px] sm:h-[240px] md:h-[340px] lg:h-[400px] border-2 border-primary/20 rounded-lg bg-muted">
                {isVideoLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted z-10 rounded-lg">
                    <Spinner className="w-8 h-8" />
                  </div>
                )}
                <video
                  className="w-full h-full rounded-md object-cover"
                  src={steps[currentStep]?.media}
                  poster="/video-placeholder.png"
                  autoPlay
                  muted
                  loop
                  playsInline
                  onLoadedData={() => setIsVideoLoading(false)}
                />
              </div>
            )}

          {!steps[currentStep]?.tabs &&
            steps[currentStep]?.mediaType === "image" && (
              <div className="mt-4 relative w-full h-[220px] sm:h-[240px] md:h-[340px] lg:h-[400px] border-2 border-primary/20 rounded-lg bg-muted">
                <img
                  src={steps[currentStep]?.media}
                  alt="Quick Guide"
                  className="w-full h-full rounded-md object-contain"
                />
              </div>
            )}
        </div>
        <DialogFooter className="flex justify-between w-full items-center sm:justify-between flex-row">
          <div className="flex gap-1">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index <= currentStep ? "bg-primary" : "bg-primary/10"
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handleBack}>
                {t("onboarding.buttons.back")}
              </Button>
            )}
            <Button onClick={handleNext}>
              {currentStep === steps.length - 1
                ? t("onboarding.buttons.close")
                : t("onboarding.buttons.next")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
