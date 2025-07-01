import useAuth from "@/hooks/use-auth";
import { useStudyGuideStore } from "@/hooks/use-study-guide-store";
import {
  useGetContent,
  useStudyGuideConceptProgress,
} from "@/query-hooks/content";
import { useParams, usePathname } from "next/navigation";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LoadingDots } from "../skeleton/loading-dots";
import AuthRequired from "../auth/auth-required";
import StudyGuideDisplayView from "./study-guide-display-view";
import StudyGuideEditView from "./study-guide-edit-view";
import StudyGuideResultView from "./study-guide-results-view";

const StudyGuide = () => {
  const params = useParams();
  const pathname = usePathname();
  const { setCurrentIndex, setData, data, view, setView } =
    useStudyGuideStore();
  const { t } = useTranslation();
  const { user, loading: userLoading } = useAuth();
  const {
    data: studyGuideConceptProgress,
    isLoading: isConceptProgressLoading,
  } = useStudyGuideConceptProgress(params.contentId as string);
  const { data: content } = useGetContent(
    params.spaceId as string,
    params.contentId as string,
    undefined,
    false,
  );

  const renderStudyGuideView = () => {
    switch (view) {
      case "display":
        return <StudyGuideDisplayView />;
      case "edit":
        return <StudyGuideEditView />;
      case "result":
        return <StudyGuideResultView />;
    }
  };

  const signInLink = `/signin${!pathname.includes("reset-password") ? `?returnUrl=${encodeURIComponent(pathname)}` : ""}`;

  // Effect to reset the study guide state when the contentId changes
  useEffect(() => {
    if (params.contentId) {
      if (!data || data.contentId !== params.contentId) {
        setView("display");
        setData({
          contentId: params.contentId as string,
          questionId: undefined,
          groupedKeyConceptIds: undefined,
        });
        setCurrentIndex(0);
      }
    }
  }, [params.contentId, data, setData, setCurrentIndex]);

  if (!user && !userLoading) {
    return (
      <div className="mt-4 px-4 sm:px-0">
        <AuthRequired message={t("studyGuide.signInRequired")} />
      </div>
    );
  }

  if (userLoading || isConceptProgressLoading) {
    return (
      <div className="mt-24 h-full w-full flex items-center justify-center px-4 sm:px-0">
        <div>
          <span className="text-shimmer">{t("quizzes.generating")}</span>
        </div>
      </div>
    );
  }

  if (
    !studyGuideConceptProgress?.groups?.length &&
    content?.type === "conversation"
  ) {
    return (
      <div className="text-center py-8 px-4 sm:px-0">
        <p className="text-muted-foreground">
          {t("studyGuide.noConversationStudyGuide")}
        </p>
      </div>
    );
  }

  if (!studyGuideConceptProgress?.groups?.length) {
    return (
      <div className="text-center py-8 px-4 sm:px-0">
        <p className="text-muted-foreground">{t("studyGuide.noTopics")}</p>
      </div>
    );
  }

  return (
    <div className="md:h-[calc(100vh-150px)] h-full overflow-y-auto px-4 sm:px-0">
      {renderStudyGuideView()}
    </div>
  );
};

export default StudyGuide;
