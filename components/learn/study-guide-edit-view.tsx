import { useStudyGuideStore } from "@/hooks/use-study-guide-store";
import React from "react";
import { Button } from "../ui/button";
import { ChevronLeft } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useStudyGuideQuestionsByContent } from "@/query-hooks/content";
import StudyGuideEditCard from "./study-guide-edit-card";

const StudyGuideEditView = () => {
  const { data, setData, setView, setCurrentIndex } = useStudyGuideStore();
  const params = useParams();
  const { t } = useTranslation();
  const contentId = params.contentId as string;
  const keyConceptId = data?.groupedKeyConceptIds?.[0] as string;
  const questionId = data?.questionId as string;
  const { data: questions, isLoading: isLoadingQuestions } =
    useStudyGuideQuestionsByContent(contentId, [keyConceptId]);

  const navigateToConcept = (conceptId?: string) => {
    setData({
      contentId: params.contentId as string,
      groupedKeyConceptIds: conceptId ? [conceptId] : undefined,
    });
    setView("display");
    setCurrentIndex(0);
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

  if (isLoadingQuestions) {
    return <>loading..</>;
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        {renderBackButton()}
      </div>
      <div className="flex flex-col space-y-2"> </div>
      {questions?.map((question) => (
        <StudyGuideEditCard key={question._id} question={question} />
      ))}
    </div>
  );
};

export default StudyGuideEditView;
