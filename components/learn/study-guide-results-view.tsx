import { ArrowRight, CheckCircle, ChevronLeft } from "lucide-react";
import React from "react";
import { Button } from "../ui/button";
import { useTranslation } from "react-i18next";
import { useStudyGuideStore } from "@/hooks/use-study-guide-store";
import { useParams } from "next/navigation";
import {
  useDeleteStudyGuideAnswer,
  useStudyGuideAnswers,
  useStudyGuideConceptProgress,
  useStudyGuideQuestionsByContent,
} from "@/query-hooks/content";

const StudyGuideResultView = () => {
  const { t } = useTranslation();
  const params = useParams();
  const { data, setData, setView, setCurrentIndex } = useStudyGuideStore();
  const { data: conceptProgress } = useStudyGuideConceptProgress(
    params.contentId as string,
  );
  const {
    mutate: deleteStudyGuideAnswer,
    isPending: isDeletingStudyGuideAnswer,
  } = useDeleteStudyGuideAnswer();
  const { data: questions } = useStudyGuideQuestionsByContent(
    params.contentId as string,
    data?.groupedKeyConceptIds,
  );
  useStudyGuideAnswers(
    params.contentId as string,
    questions?.map((question) => question._id),
    !!questions?.length,
  );

  const currentConcept = conceptProgress?.groups.find(
    (concept) => concept.group_id === data?.groupedKeyConceptIds?.[0],
  );

  const currentConceptIndex = conceptProgress?.groups.findIndex(
    (concept) => concept.group_id === data?.groupedKeyConceptIds?.[0],
  );

  const remainingConcepts = conceptProgress?.groups.filter(
    (concept) => concept.progress !== 100,
  );

  const nextConcept = remainingConcepts?.[0];

  const navigateToConcept = (conceptId?: string) => {
    setData({
      contentId: params.contentId as string,
      groupedKeyConceptIds: conceptId ? [conceptId] : undefined,
    });
    setView("display");
    setCurrentIndex(0);
  };

  const retryStudyGuideConcept = (groupedKeyConceptIds?: string[]) => {
    deleteStudyGuideAnswer(
      {
        contentId: params.contentId as string,
        groupedKeyConceptIds: groupedKeyConceptIds,
      },
      {
        onSuccess: () => {
          if (groupedKeyConceptIds) {
            navigateToConcept(groupedKeyConceptIds?.[0]);
          } else {
            navigateToConcept();
          }
        },
      },
    );
  };

  const renderBackButton = () => {
    return (
      <Button
        className="w-fit flex items-center gap-2 py-1 mb-2 text-muted-foreground"
        size="sm"
        variant="ghost"
        onClick={() => navigateToConcept()}
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="text-sm">{t("studyGuide.back")}</span>
      </Button>
    );
  };

  const renderNextButton = () => {
    return (
      <>
        {nextConcept ? (
          <Button
            onClick={() => navigateToConcept(nextConcept?.group_id as string)}
            className="flex items-center gap-2"
          >
            {t("boardPagination.next")}: {nextConcept?.title}
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            className="flex items-center gap-2"
            disabled={isDeletingStudyGuideAnswer}
            onClick={() => retryStudyGuideConcept()}
          >
            {t("studyGuide.allConceptsCompleted")}
          </Button>
        )}
      </>
    );
  };

  if (!questions || questions?.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto overscroll-y-none p-2">
        <div className="flex justify-between items-center mb-4">
          {renderBackButton()}
        </div>

        <div className="text-center flex flex-col items-center mt-8 gap-6">
          <div className="text-muted-foreground text-center">
            {t("noQuestionsFound")}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto relative h-full md:h-[calc(100vh-150px)] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        {renderBackButton()}
      </div>

      <div className="text-center flex flex-col items-center mt-8 gap-4">
        <div className="flex flex-col items-center gap-2">
          <CheckCircle className="h-24 w-24 text-green-500" />
          <h3 className="text-lg font-medium mt-8">
            {t("studyGuide.quizComplete", {
              number: (currentConceptIndex as number) + 1,
              name: currentConcept?.title,
              interpolation: { escapeValue: false },
            })}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            {t("studyGuide.completeMessage")}
          </p>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <Button
            onClick={() =>
              retryStudyGuideConcept([currentConcept?.group_id as string])
            }
            variant="outline"
            className="flex items-center gap-2"
            disabled={isDeletingStudyGuideAnswer}
          >
            {isDeletingStudyGuideAnswer
              ? t("spaceHeader.loading")
              : t("studyGuide.restart")}
          </Button>

          {renderNextButton()}
        </div>
      </div>
    </div>
  );
};

export default StudyGuideResultView;
