import Flashcards from "./flashcards";
import { useFlashcardStore } from "@/hooks/use-flashcard-store";
import FlashcardsActiveIntro from "./flashcards-active-intro";
import { useParams } from "next/navigation";
import useAuth from "@/hooks/use-auth";
import AuthRequired from "../auth/auth-required";
import { useTranslation } from "react-i18next";

export default function FlashcardsActive() {
  const { introSeenActiveRecall } = useFlashcardStore();
  const params = useParams();
  const contentId = params.contentId as string;
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  if (!user && !loading) {
    return (
      <div key="error-container" className="w-full flex justify-center mt-4">
        {!user ? (
          <AuthRequired message={t("flashcards.auth.message")} />
        ) : (
          <span className="text-muted-foreground text-center">
            {t("flashcards.noFlashcards")}
          </span>
        )}
      </div>
    );
  }

  if (loading) {
    return null;
  }

  if (!introSeenActiveRecall[contentId]) {
    return <FlashcardsActiveIntro />;
  }

  return <Flashcards />;
}
