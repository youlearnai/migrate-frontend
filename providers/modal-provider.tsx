"use client";
import ClearChatModal from "@/components/modals/clear-chat-modal";
import ContentDeleteModal from "@/components/modals/content-delete-modal";
import AccountDeleteModal from "@/components/modals/delete-account-modal";
import ErrorModal from "@/components/modals/error-modal";
import ExportFlashcardsModal from "@/components/modals/export-flashcards-modal";
import FeedbackModal from "@/components/modals/feedback-modal";
import ImageModal from "@/components/modals/image-modal";
import KeyboardModal from "@/components/modals/keyboard-modal";
import MagicBarModal from "@/components/modals/magic-bar-modal";
import NewFeatureModal from "@/components/modals/new-feature-modal";
import OnboardingModal from "@/components/modals/onboarding-modal";
import ScheduleModal from "@/components/modals/schedule-modal";
import { ShareContentModal } from "@/components/modals/share-content-modal";
import ShareSpaceModal from "@/components/modals/share-space-modal";
import AuthModal from "@/components/modals/auth-modal";
import SpaceDeleteModal from "@/components/modals/space-delete-modal";
import SpaceModal from "@/components/modals/space-modal";
import UpgradeModal from "@/components/modals/upgrade-modal";
import VoiceLimitModal from "@/components/modals/voice-limit-modal";
import FlashcardFeedbackModal from "@/components/modals/flashcard-feedback-modal";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ExamChatModal from "@/components/modals/exam-chat-modal";
import QuickGuideModal from "@/components/modals/quick-guide-modal";
import SummaryCustomizeModal from "@/components/modals/summary-customize-modal";
import CancelSubscriptionModal from "@/components/modals/cancel-subscription-modal";
import ShareExamModal from "@/components/modals/share-exam-modal";
import TeamPricingFormModal from "@/components/modals/team-pricing-form-modal";
import PauseSubscriptionModal from "@/components/modals/pause-subscription-modal";
import PauseSubscriptionPrompt from "@/components/modals/pause-subscription-prompt";
import RecordingOptionsModal from "@/components/modals/recording-options-modal";
import RecordingInstructionsModal from "@/components/modals/recording-instructions-modal";
import { FlashcardActiveRecallSettingsModal } from "@/components/modals/flashcard-active-recall-settings-modal";
import { FlashcardFilterModal } from "@/components/modals/flashcard-filter-modal";
import ContentPreviewModal from "@/components/modals/content-preview-modal";

export default function ModalProvider() {
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const isLearnPage = pathname.includes("/learn");
  const isExamPage = pathname.includes("/exam");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <ErrorModal />
      <UpgradeModal />
      <SpaceModal />
      <SpaceDeleteModal />
      <ContentDeleteModal />
      <AccountDeleteModal />
      <ImageModal />
      <KeyboardModal />
      <ShareSpaceModal />
      <OnboardingModal />
      <QuickGuideModal />
      <NewFeatureModal />
      <ShareContentModal />
      <FeedbackModal />
      <ClearChatModal />
      <ScheduleModal />
      <VoiceLimitModal />
      <FlashcardFeedbackModal />
      <ExportFlashcardsModal />
      <MagicBarModal />
      <AuthModal />
      <TeamPricingFormModal />
      <CancelSubscriptionModal />
      <PauseSubscriptionModal />
      <PauseSubscriptionPrompt />
      <RecordingOptionsModal />
      <RecordingInstructionsModal />
      <FlashcardActiveRecallSettingsModal />
      <FlashcardFilterModal />
      {isExamPage && <ExamChatModal />}
      {isLearnPage && <SummaryCustomizeModal />}
      <ShareExamModal />
      <ContentPreviewModal />
    </>
  );
}
