import React, { useState, useEffect } from "react";
import { QuestionType } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { Loader2, RotateCcw, Settings2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useStudyGuideStore } from "@/hooks/use-study-guide-store";
import { cn } from "@/lib/utils";
import {
  useUpdateUserContentStudyGuideDifficulty,
  useUpdateUserContentStudyGuidePreferences,
} from "@/query-hooks/user";
import { useParams } from "next/navigation";
import { useGetContent } from "@/query-hooks/content";
import DifficultyChecklist from "./difficulty-checklist";
import QuestionTypeChecklist from "./question-type-checklist";
import { QuizDifficulty } from "@/lib/types";

const StudyGuidePreferencesDropdown = ({
  initialQuestionTypes,
  onRestart,
  onRegenerate,
  questionTypes,
  setQuestionTypes,
  isRestarting,
  isRegenerating,
  isDropdown = true,
  setDifficulties,
  difficulties,
}: {
  initialQuestionTypes: QuestionType[];
  onRestart: () => void;
  onRegenerate: () => void;
  questionTypes: QuestionType[];
  setQuestionTypes: (questionTypes: QuestionType[]) => void;
  isRestarting: boolean;
  isRegenerating: boolean;
  isDropdown?: boolean;
  setDifficulties: (difficulties: QuizDifficulty[]) => void;
  difficulties: QuizDifficulty[];
}) => {
  const params = useParams();
  const { data } = useStudyGuideStore();
  const { t } = useTranslation();
  const {
    mutate: mutateUpdateUserContentStudyGuidePreferences,
    isPending: isUpdatingUserContentStudyGuidePreferences,
  } = useUpdateUserContentStudyGuidePreferences();
  const {
    mutate: mutateUpdateUserContentStudyGuideDifficulties,
    isPending: isUpdatingUserContentStudyGuideDifficulties,
  } = useUpdateUserContentStudyGuideDifficulty();
  const { data: content } = useGetContent(
    params.spaceId as string,
    params.contentId as string,
    { enabled: !!params.contentId },
    false,
  );

  useEffect(() => {
    if (!questionTypes?.length) {
      setQuestionTypes(["multiple_choice"]);
    }

    if (!difficulties?.length) {
      setDifficulties(["medium"]);
    }
  }, [questionTypes, difficulties, setQuestionTypes, setDifficulties]);

  const handleRestart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onRestart();
  };

  const handleRegenerate = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onRegenerate();
  };

  const handleUpdateUserContentStudyGuidePreferences = (
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.stopPropagation();
    mutateUpdateUserContentStudyGuidePreferences({
      contentId: params.contentId as string,
      questionTypes,
    });
    mutateUpdateUserContentStudyGuideDifficulties({
      contentId: params.contentId as string,
      preferences: difficulties,
    });
  };

  const haveQuestionTypesChanged = (): boolean => {
    return !(
      questionTypes?.length === initialQuestionTypes?.length &&
      questionTypes?.every((type) => initialQuestionTypes?.includes?.(type)) &&
      initialQuestionTypes?.every((type) => questionTypes?.includes?.(type))
    );
  };

  if (!isDropdown) {
    return (
      <div className="pt-0 2xl:pt-6 w-full flex flex-col items-center justify-center min-h-[100px]">
        <div className="space-y-4 w-fit">
          <h3 className="text-base font-medium text-center text-primary/80">
            {t("studyGuide.quizPreferences")}
          </h3>

          <div className="space-y-2">
            <div className="p-1.5 rounded-2xl border border-primary/20 bg-card w-fit mx-auto max-w-[18.5rem]">
              <QuestionTypeChecklist
                questionTypes={questionTypes}
                setQuestionTypes={setQuestionTypes}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="p-1.5 rounded-2xl border border-primary/20 bg-card w-fit mx-auto ">
              <DifficultyChecklist
                difficulties={difficulties}
                setDifficulties={setDifficulties}
              />
            </div>
          </div>

          <Button
            className={cn(
              "w-full text-sm py-5 h-10 rounded-2xl transition-opacity",
              haveQuestionTypesChanged()
                ? "opacity-100"
                : "opacity-0 pointer-events-none",
            )}
            variant="default"
            size="sm"
            onClick={handleUpdateUserContentStudyGuidePreferences}
            disabled={
              isUpdatingUserContentStudyGuidePreferences ||
              isUpdatingUserContentStudyGuideDifficulties ||
              !haveQuestionTypesChanged()
            }
          >
            {isUpdatingUserContentStudyGuidePreferences ||
            isUpdatingUserContentStudyGuideDifficulties ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-[18px] w-[18px] min-w-[18px] min-h-[18px] animate-spin" />
                {t("chats.loadingSkeleton.skeletonText1")}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {t("flashcards.generate")}
              </div>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-none text-muted-foreground"
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent onClick={(e) => e.stopPropagation()} align="end">
        <DropdownMenuLabel className="flex font-semibold items-center gap-2 justify-center p-3 cursor-default">
          {t("studyGuide.preferences")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleRestart} className="p-4">
          {isRestarting ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("restarting")}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              {data?.groupedKeyConceptIds
                ? t("studyGuide.restart")
                : t("restartAll")}
            </div>
          )}
        </DropdownMenuItem>

        {content?.type != "conversation" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="p-4 cursor-default focus:bg-transparent">
              <div className="w-fit flex flex-col items-center">
                <div className="w-fit space-y-4">
                  <h3 className="text-sm font-medium text-left text-primary/80">
                    {t("studyGuide.quizPreferences")}
                  </h3>

                  <div className="space-y-2">
                    <div className="p-1 rounded-2xl max-w-[18rem] border border-primary/10 bg-card w-fit">
                      <QuestionTypeChecklist
                        questionTypes={questionTypes}
                        setQuestionTypes={setQuestionTypes}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="p-1 rounded-2xl border border-primary/10 bg-card w-fit">
                      <DifficultyChecklist
                        difficulties={difficulties}
                        setDifficulties={setDifficulties}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full text-sm py-5 h-10 rounded-2xl mt-4"
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                >
                  {isRegenerating
                    ? t("studyGuide.regeneratingQuestions")
                    : t("studyGuide.regenerate")}
                </Button>
              </div>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default StudyGuidePreferencesDropdown;
