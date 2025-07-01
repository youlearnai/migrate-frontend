import React, { useEffect, useState } from "react";
import { useStudyGuideStore } from "@/hooks/use-study-guide-store";
import { useTranslation } from "react-i18next";
import {
  useDeleteStudyGuideAnswer,
  useMutateStudyGuideAnswers,
  useMutateStudyGuideQuestionsByContent,
  useRegenerateStudyGuideQuestions,
  useStudyGuideConceptProgress,
} from "@/query-hooks/content";
import {
  StudyGuideConceptGroup,
  QuestionType,
  QuizDifficulty,
} from "@/lib/types";
import { Circle, CircleCheck, Loader2, RotateCcw } from "lucide-react";
import { Progress } from "../ui/progress";
import { CircleDotDashed } from "lucide-react";
import StudyGuidePreferencesDropdown from "./study-guide-prefernces-dropdown";
import StudyGuidePractice from "./study-guide-practice";
import { useParams } from "next/navigation";
import { StudyGuideConceptProgressSkeleton } from "../skeleton/study-guide-skeleton";
import { Button } from "../ui/button";
import {
  useGetUserContentStudyGuideDifficulty,
  useGetUserContentStudyGuidePreferences,
} from "@/query-hooks/user";

const ConceptCard = ({
  concept,
  index,
  isDisabled,
}: {
  concept: StudyGuideConceptGroup;
  index: number;
  isDisabled: boolean;
}) => {
  const { t } = useTranslation();
  const params = useParams();
  const { setData, setCurrentIndex } = useStudyGuideStore();
  const { mutate: deleteStudyGuideAnswer, isPending: isDeletingAnswer } =
    useDeleteStudyGuideAnswer();
  const { mutate: mutateStudyGuideQuestionsByContent } =
    useMutateStudyGuideQuestionsByContent();
  const { mutate: mutateStudyGuideAnswers } = useMutateStudyGuideAnswers();
  const progress = concept.progress;

  const handleConceptClick = (conceptId: string) => {
    setData({
      contentId: params.contentId as string,
      groupedKeyConceptIds: [conceptId],
    });
    setCurrentIndex(0);
  };

  const handleRestart = (groupedKeyConceptIds?: string[]) => {
    deleteStudyGuideAnswer(
      {
        contentId: params.contentId as string,
        groupedKeyConceptIds: groupedKeyConceptIds,
      },
      {
        onSuccess: () => {
          mutateStudyGuideQuestionsByContent(
            {
              contentId: params.contentId as string,
              groupedKeyConceptIds: groupedKeyConceptIds,
            },
            {
              onSuccess: (data) => {
                const questions = data;
                mutateStudyGuideAnswers({
                  contentId: params.contentId as string,
                  questionIds: questions?.map((question) => question._id),
                });
              },
            },
          );
        },
      },
    );
  };
  return (
    <div
      onClick={
        isDisabled ? undefined : () => handleConceptClick(concept.group_id)
      }
      className="w-full p-4 border relative border-border rounded-lg hover:bg-muted dark:hover:bg-muted hover:shadow-sm dark:hover:border-white/10 transition-all duration-200 cursor-pointer bg-card dark:bg-neutral-800/50 flex flex-col gap-4"
    >
      {isDisabled && (
        <div className="absolute cursor-not-allowed inset-0 flex items-center justify-center bg-background/50 rounded-lg z-10" />
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <div className="text-xs font-medium text-muted-foreground">
            {t("studyGuide.quizNumber", { number: index })}
          </div>
          <h3 className="font-medium capitalize">{concept.title}</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={(e) => {
              e.stopPropagation();
              handleRestart([concept.group_id]);
            }}
          >
            {isDeletingAnswer ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
          </Button>
          {progress === 100 ? (
            <CircleCheck className="h-5 w-5 text-green-500" />
          ) : progress > 0 ? (
            <CircleDotDashed className="h-5 w-5 text-yellow-500" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground/30" />
          )}
        </div>
      </div>

      <div className="flex gap-3 items-center justify-between">
        <Progress
          parentClassName="h-2"
          className="bg-green-500 rounded-full transition-all duration-300 opacity-80"
          value={progress}
        />
        <span className="text-xs font-medium text-muted-foreground">
          {progress.toFixed(0)}%
        </span>
      </div>
    </div>
  );
};

const StudyGuideDisplayView = () => {
  const params = useParams();
  const { data } = useStudyGuideStore();
  const {
    data: studyGuideConceptProgress,
    isLoading: isConceptProgressLoading,
  } = useStudyGuideConceptProgress(data?.contentId as string);
  const { mutate: deleteStudyGuideAnswer, isPending: isDeletingAnswer } =
    useDeleteStudyGuideAnswer();
  const { mutate: regenerateStudyGuide, isPending: isRegeneratingStudyGuide } =
    useRegenerateStudyGuideQuestions();
  const { mutate: mutateStudyGuideQuestionsByContent } =
    useMutateStudyGuideQuestionsByContent();
  const { mutate: mutateStudyGuideAnswers } = useMutateStudyGuideAnswers();
  const {
    data: userContentStudyGuidePreferences,
    isLoading: isUserContentStudyGuidePreferencesLoading,
  } = useGetUserContentStudyGuidePreferences(params.contentId as string);
  const {
    data: userContentStudyGuideDifficulties,
    isLoading: isUserContentStudyGuideDifficultiesLoading,
  } = useGetUserContentStudyGuideDifficulty(params.contentId as string);

  const currentConcept = studyGuideConceptProgress?.groups.find(
    (concept) => concept.group_id === data?.groupedKeyConceptIds?.[0],
  );

  const handleRestart = () => {
    deleteStudyGuideAnswer(
      {
        contentId: params.contentId as string,
      },
      {
        onSuccess: () => {
          mutateStudyGuideQuestionsByContent(
            {
              contentId: params.contentId as string,
            },
            {
              onSuccess: (data) => {
                const questions = data;
                mutateStudyGuideAnswers({
                  contentId: params.contentId as string,
                  questionIds: questions?.map((question) => question._id),
                });
              },
            },
          );
        },
      },
    );
  };

  const handleRegenerateStudyGuide = () => {
    regenerateStudyGuide(
      {
        contentId: params.contentId as string,
        questionTypes: questionTypes,
        difficulties: difficulties,
      },
      {
        onSuccess: () => {
          mutateStudyGuideQuestionsByContent(
            {
              contentId: params.contentId as string,
            },
            {
              onSuccess: (data) => {
                const questions = data;
                mutateStudyGuideAnswers({
                  contentId: params.contentId as string,
                  questionIds: questions?.map((question) => question._id),
                });
              },
            },
          );
        },
      },
    );
  };

  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>(
    userContentStudyGuidePreferences as QuestionType[],
  );
  const [difficulties, setDifficulties] = useState<QuizDifficulty[]>([]);

  useEffect(() => {
    setQuestionTypes(userContentStudyGuidePreferences as QuestionType[]);
    setDifficulties(userContentStudyGuideDifficulties as QuizDifficulty[]);
  }, [userContentStudyGuidePreferences, userContentStudyGuideDifficulties]);

  if (
    isConceptProgressLoading ||
    isUserContentStudyGuidePreferencesLoading ||
    isUserContentStudyGuideDifficultiesLoading
  ) {
    return <StudyGuideConceptProgressSkeleton />;
  }

  if (userContentStudyGuidePreferences?.length === 0) {
    return (
      <div className="w-full">
        <StudyGuidePreferencesDropdown
          initialQuestionTypes={
            userContentStudyGuidePreferences as QuestionType[]
          }
          onRestart={handleRestart}
          onRegenerate={handleRegenerateStudyGuide}
          questionTypes={questionTypes as QuestionType[]}
          setQuestionTypes={setQuestionTypes}
          isRestarting={isDeletingAnswer}
          isRegenerating={isRegeneratingStudyGuide}
          isDropdown={false}
          difficulties={difficulties}
          setDifficulties={setDifficulties}
        />
      </div>
    );
  }

  return (
    <div>
      {!data?.groupedKeyConceptIds && (
        <div className="w-full">
          <div className="flex items-center justify-end mb-3">
            {questionTypes && (
              <StudyGuidePreferencesDropdown
                initialQuestionTypes={
                  userContentStudyGuidePreferences as QuestionType[]
                }
                onRestart={handleRestart}
                onRegenerate={handleRegenerateStudyGuide}
                questionTypes={questionTypes as QuestionType[]}
                setQuestionTypes={setQuestionTypes}
                isRestarting={isDeletingAnswer}
                isRegenerating={isRegeneratingStudyGuide}
                difficulties={difficulties}
                setDifficulties={setDifficulties}
              />
            )}
          </div>
          <div className="grid gap-4 grid-cols-1">
            {studyGuideConceptProgress?.groups.map((concept, index) => (
              <ConceptCard
                key={concept.group_id}
                concept={concept}
                index={index + 1}
                isDisabled={isDeletingAnswer || isRegeneratingStudyGuide}
              />
            ))}
          </div>
        </div>
      )}
      <div key={currentConcept?.group_id}>
        {data?.groupedKeyConceptIds && currentConcept && (
          <StudyGuidePractice
            concept={currentConcept as StudyGuideConceptGroup}
          />
        )}
      </div>
    </div>
  );
};

export default StudyGuideDisplayView;
