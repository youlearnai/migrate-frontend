import {
  useDeleteStudyGuideAnswer,
  useGetContent,
  useRegenerateStudyGuideQuestions,
  useStudyGuideAnswers,
  useStudyGuideQuestionsByContent,
  useSubmitStudyGuideAnswer,
} from "@/query-hooks/content";
import { useParams } from "next/navigation";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useStudyGuideLimit } from "@/query-hooks/limit";
import { useChat, useChatHistory } from "@/query-hooks/generation";
import { useStudyGuideStore } from "@/hooks/use-study-guide-store";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import {
  Check,
  ChevronLeft,
  CornerDownRight,
  Mic,
  RotateCcw,
  X,
  Loader2,
} from "lucide-react";
import StudyGuidePreferencesDropdown from "./study-guide-prefernces-dropdown";
import { Progress } from "../ui/progress";
import StudyGuideQuestionCard from "./study-guide-question-card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Separator } from "../ui/separator";
import ChatMessages from "./chat-messages";
import ChatSubmit from "./chat-submit";
import { useAgenticModeStore } from "@/hooks/use-agentic-mode-store";
import { useHighlightStore } from "@/hooks/use-highlight-store";
import { useScreenshotStore } from "@/hooks/use-screenshot-store";
import { useUserProfile } from "@/query-hooks/user";
import {
  AnswerStatus,
  ContentType,
  StudyGuideAnswer,
  QuestionType,
  StudyGuideConceptGroup,
  QuizDifficulty,
} from "@/lib/types";
import { Question } from "@/lib/types";
import { useWebSearchStore } from "@/hooks/use-web-search-store";
import ResultStatus from "./result-status";
import { useCurrentSourceStore } from "@/hooks/use-current-source-store";
import { useStudyGuideVoiceRecording } from "@/hooks/use-study-guide-voice-recording";

const StudyGuidePractice = ({
  concept,
}: {
  concept: StudyGuideConceptGroup;
}) => {
  const { t } = useTranslation();
  const params = useParams();
  const contentId = params.contentId as string;
  const carouselRef = useRef<HTMLDivElement>(null);
  const {
    currentIndex,
    setData,
    data,
    setView,
    setCurrentIndex,
    navigatedGroupId,
    setNavigatedGroupId,
  } = useStudyGuideStore();
  const { data: fetchedContent, isLoading: isLoadingFetchedContent } =
    useGetContent(params.spaceId as string | undefined, contentId);
  const { data: questions, isLoading } = useStudyGuideQuestionsByContent(
    contentId,
    [concept.group_id],
  );
  const { data: studyGuideAnswers, isLoading: isLoadingAnswers } =
    useStudyGuideAnswers(
      contentId,
      questions?.map((q) => q._id),
      !!questions?.length,
    );
  const { isLoading: isStudyGuideLimitLoading } = useStudyGuideLimit();
  const { data: chats } = useChatHistory(
    params.spaceId as string | undefined,
    params.spaceId ? "space" : "content",
    contentId,
  );
  const {
    mutate: deleteStudyGuideAnswer,
    isPending: isDeletingStudyGuideAnswer,
  } = useDeleteStudyGuideAnswer();
  const { mutate: submitAnswer, isPending: isSubmittingAnswer } =
    useSubmitStudyGuideAnswer();
  const {
    mutate: submit,
    loading: isSubmitting,
    streaming: isStreaming,
  } = useChat();
  const { currentSource } = useCurrentSourceStore();
  const { isWebSearch } = useWebSearchStore();
  const { screenshot, onScreenshot } = useScreenshotStore();
  const { highlight, data: highlightData, onHighlight } = useHighlightStore();
  const { isAgentic } = useAgenticModeStore();
  const { data: userProfile } = useUserProfile();
  const { data: studyGuideAnswer, isLoading: isLoadingStudyGuideAnswer } =
    useStudyGuideAnswers(
      contentId,
      questions?.map((q) => q._id),
    );
  const [frqAnswer, setFrqAnswer] = useState<string>("");
  const [incorrectAnswers, setIncorrectAnswers] = useState<StudyGuideAnswer[]>(
    [],
  );
  const currentQuestion = questions?.[currentIndex];
  const currentStudyGuideAnswers = studyGuideAnswer?.filter(
    (answer) => answer.question.id === currentQuestion?._id,
  );
  const { mutate: regenerateStudyGuide, isPending: isRegeneratingStudyGuide } =
    useRegenerateStudyGuideQuestions();
  const latestCurrentStudyGuideAnswer = currentStudyGuideAnswers?.at(-1);
  const contentType = fetchedContent?.type;
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>(
    concept.question_types as QuestionType[],
  );
  const [difficulties, setDifficulties] = useState<QuizDifficulty[]>([]);
  const { recordingState, startRecording, stopAndTranscribe, cancelRecording } =
    useStudyGuideVoiceRecording();

  const handleStopAndTranscribe = () => {
    stopAndTranscribe((text: string) => {
      setFrqAnswer(frqAnswer + " " + text);
    });
  };

  const filteredChats = useMemo(
    () => chats?.filter((chat) => chat.question_id === currentQuestion?._id),
    [chats, currentQuestion],
  );

  const CHAT_QUESTIONS = [
    t("studyGuide.hints.giveHint"),
    t("studyGuide.hints.walkThrough"),
    t("studyGuide.hints.keepSimple"),
  ];

  const correctAnswers = useMemo(() => {
    if (!studyGuideAnswers) return;
    return studyGuideAnswers?.filter((answer) => answer.score === 100);
  }, [studyGuideAnswers]);

  const areAllQuestionsCompleted = useCallback(() => {
    return (
      questions?.every((question) => {
        const questionAnswers = studyGuideAnswers?.filter(
          (answer) => answer.question.id === question._id,
        );
        const latestAnswer = questionAnswers?.at(-1);

        return latestAnswer?.score === 100 || latestAnswer?.is_completed;
      }) || false
    );
  }, [questions, studyGuideAnswers]);

  const answerStatus = useMemo(() => {
    if (latestCurrentStudyGuideAnswer?.is_completed) {
      return "markedComplete";
    }

    if (latestCurrentStudyGuideAnswer?.score === 100) {
      return "correct";
    }

    if (
      latestCurrentStudyGuideAnswer?.answer === null &&
      latestCurrentStudyGuideAnswer?.score === 0
    ) {
      return "dontKnow";
    }

    if (
      typeof latestCurrentStudyGuideAnswer?.score === "number" &&
      latestCurrentStudyGuideAnswer?.score >= 0 &&
      latestCurrentStudyGuideAnswer?.score < 100 &&
      latestCurrentStudyGuideAnswer?.answer !== null
    ) {
      return "incorrect";
    }

    return "unattempted";
  }, [latestCurrentStudyGuideAnswer]);

  const isLastQuestion = currentIndex === (questions?.length as number) - 1;
  const isUnattempted = answerStatus === "unattempted";
  const isMarkedComplete = answerStatus === "markedComplete";

  const handleDeleteAnswer = useCallback(
    (
      answerIds?: string[],
      onSuccess?: () => void,
      groupedKeyConceptIds?: string[],
    ) => {
      deleteStudyGuideAnswer(
        {
          contentId,
          answerIds: answerIds,
          groupedKeyConceptIds: groupedKeyConceptIds,
        },
        {
          onSuccess: () => {
            if (onSuccess) onSuccess();
          },
        },
      );
    },
    [deleteStudyGuideAnswer, contentId],
  );

  const handleSubmitAnswer = useCallback(
    (answer: string | undefined, isCompleted?: boolean) => {
      submitAnswer(
        {
          questionId: currentQuestion?._id as string,
          contentId: contentId,
          answer: answer,
          isCompleted: isCompleted || false,
        },
        {
          onSuccess: (response) => {
            setFrqAnswer("");
          },
        },
      );
    },
    [currentQuestion?._id, submitAnswer],
  );

  const handleChatSubmit = useCallback(
    (message: string) => {
      submit({
        contentId: contentId,
        spaceId: params.spaceId as string | undefined,
        query: message,
        questionId: currentQuestion?._id,
        getExistingChatHistory: true,
        saveChatHistory: true,
        quoteText: highlight || undefined,
        quoteId: highlightData?.quoteId!,
        imageUrls: screenshot!,
        chatModelId: userProfile?.user_profile.chat_model_id!,
        agent: isAgentic,
        isWebSearch: isWebSearch,
        currentSource: currentSource,
      });
      onHighlight(null);
      onScreenshot(null);
    },
    [
      contentId,
      currentQuestion,
      submit,
      params.spaceId,
      isAgentic,
      highlight,
      highlightData,
      screenshot,
      userProfile?.user_profile.chat_model_id,
      onHighlight,
      onScreenshot,
      currentSource,
    ],
  );

  const renderChatQuestions = useCallback(
    (questions: string[]) => {
      return (
        <div className="flex flex-row gap-4 my-4">
          {filteredChats &&
            filteredChats.length === 0 &&
            questions?.length > 0 &&
            questions.map((question, index) => (
              <div
                onClick={() => handleChatSubmit(question)}
                key={index}
                className="w-full last:hidden md:last:block"
              >
                <div
                  className={`items-center cursor-pointer hover:bg-primary/10 flex transition-all duration-500 h-full leading-relaxed border p-2 rounded-2xl text-sm`}
                >
                  <CornerDownRight className="flex-shrink-0 w-6 ml-1 h-6" />
                  <span className="ml-3 line-clamp-2">{question}</span>
                </div>
              </div>
            ))}
        </div>
      );
    },
    [filteredChats, handleChatSubmit],
  );

  const handleNext = useCallback(() => {
    if (!questions) return;

    if (
      answerStatus != "correct" &&
      answerStatus != "markedComplete" &&
      latestCurrentStudyGuideAnswer
    ) {
      if (
        !incorrectAnswers.some(
          (answer) => answer._id === latestCurrentStudyGuideAnswer._id,
        )
      ) {
        setIncorrectAnswers((prev) => [...prev, latestCurrentStudyGuideAnswer]);
      }
    }

    if (areAllQuestionsCompleted()) {
      setView("result");
      return;
    }

    let nextIndex = currentIndex;
    let foundNextQuestion = false;
    let nextQuestionAnswerIds: string[] = [];

    for (let i = 1; i <= questions.length; i++) {
      const checkIndex = (currentIndex + i) % questions.length;
      const questionToCheck = questions[checkIndex];
      const questionAnswers = studyGuideAnswers?.filter(
        (answer) => answer.question.id === questionToCheck._id,
      );
      const latestAnswer = questionAnswers?.at(-1);

      const isCorrectOrCompleted =
        latestAnswer?.score === 100 || latestAnswer?.is_completed;

      if (!isCorrectOrCompleted) {
        nextIndex = checkIndex;
        foundNextQuestion = true;
        nextQuestionAnswerIds = questionAnswers?.map(
          (answer) => answer._id,
        ) as string[];
        break;
      }
    }

    if (nextQuestionAnswerIds && nextQuestionAnswerIds.length > 0) {
      handleDeleteAnswer(nextQuestionAnswerIds, () => {
        setCurrentIndex(nextIndex);
      });
    } else {
      setCurrentIndex(nextIndex);
    }
  }, [
    questions,
    answerStatus,
    latestCurrentStudyGuideAnswer,
    incorrectAnswers,
    areAllQuestionsCompleted,
    setView,
    currentIndex,
    studyGuideAnswers,
    handleDeleteAnswer,
    setCurrentIndex,
  ]);

  const handleBackToKeyConcepts = () => {
    setData({
      contentId: params.contentId as string,
      groupedKeyConceptIds: undefined,
    });
    setCurrentIndex(0);
  };

  const handleRegenerateStudyGuide = () => {
    regenerateStudyGuide({
      contentId: params.contentId as string,
      groupedKeyConceptIds: [concept.group_id],
      questionTypes: questionTypes,
      difficulties: difficulties,
    });
    setQuestionTypes(concept.question_types as QuestionType[]);
  };

  const renderBackButton = () => {
    return (
      <Button
        className="w-fit flex items-center gap-2 py-1 mb-2 text-muted-foreground"
        size="sm"
        variant="ghost"
        onClick={handleBackToKeyConcepts}
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="text-sm">{t("studyGuide.back")}</span>
      </Button>
    );
  };

  const renderPreferences = () => {
    return (
      <StudyGuidePreferencesDropdown
        initialQuestionTypes={concept.question_types}
        questionTypes={questionTypes}
        setQuestionTypes={setQuestionTypes}
        onRestart={() =>
          handleDeleteAnswer(undefined, undefined, data?.groupedKeyConceptIds)
        }
        onRegenerate={handleRegenerateStudyGuide}
        isRestarting={isDeletingStudyGuideAnswer}
        isRegenerating={isRegeneratingStudyGuide}
        setDifficulties={setDifficulties}
        difficulties={difficulties}
      />
    );
  };

  const renderProgress = () => {
    const answers = correctAnswers?.length as number;
    return (
      <div className={cn("flex flex-row items-center px-2 gap-3", "py-2")}>
        <span className="text-sm font-medium text-muted-foreground">
          {answers}
        </span>
        <Progress
          parentClassName="h-2"
          className="bg-green-500 rounded-full transition-all duration-300 opacity-80"
          value={(answers / (questions?.length as number)) * 100}
        />
        <span className="text-sm font-medium text-muted-foreground">
          {questions?.length}
        </span>
      </div>
    );
  };

  const renderRetryButton = () => {
    const isRecordingOrProcessing =
      recordingState === "recording" || recordingState === "processing";
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              disabled={
                isUnattempted ||
                isDeletingStudyGuideAnswer ||
                isRecordingOrProcessing
              }
              onClick={() =>
                handleDeleteAnswer(
                  currentStudyGuideAnswers?.map(
                    (answer) => answer._id,
                  ) as string[],
                )
              }
              variant="outline"
              size="icon"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("studyGuide.retry")}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const renderMarkCompletedButton = () => {
    const isRecordingOrProcessing =
      recordingState === "recording" || recordingState === "processing";
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => handleSubmitAnswer(undefined, true)}
              variant="outline"
              size="icon"
              disabled={
                isSubmittingAnswer ||
                isMarkedComplete ||
                isRecordingOrProcessing
              }
            >
              <Check className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("markComplete")}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const renderDontKnowButton = () => {
    const isRecordingOrProcessing =
      recordingState === "recording" || recordingState === "processing";
    return (
      <Button
        disabled={!isUnattempted || isRecordingOrProcessing}
        onClick={() => handleSubmitAnswer(undefined)}
        variant="outline"
      >
        {t("dontKnow")}
      </Button>
    );
  };

  const renderSubmitButton = () => {
    const isAnswerEmpty = !frqAnswer.trim();
    const isRecordingOrProcessing =
      recordingState === "recording" || recordingState === "processing";
    return (
      <Button
        disabled={
          isSubmittingAnswer || isAnswerEmpty || isRecordingOrProcessing
        }
        onClick={() => handleSubmitAnswer(frqAnswer)}
      >
        {isSubmittingAnswer
          ? t("summaryOptionsModal.submitting")
          : t("contact.form.submit")}
      </Button>
    );
  };

  const renderNextButton = () => {
    const isRecordingOrProcessing =
      recordingState === "recording" || recordingState === "processing";
    return (
      <Button onClick={handleNext} disabled={isRecordingOrProcessing}>
        {areAllQuestionsCompleted() ? t("complete") : t("boardPagination.next")}
      </Button>
    );
  };

  const renderNavigateButtons = () => {
    return (
      <div className="flex justify-between space-x-2">
        <div className="flex space-x-2">
          {renderRetryButton()}
          {renderMarkCompletedButton()}
        </div>
        <div className="flex space-x-2 ml-2">
          {renderDontKnowButton()}
          {isUnattempted &&
            (currentQuestion?.question_type === "free_response" ||
              currentQuestion?.question_type === "fill_in_blanks") &&
            renderSubmitButton()}
          {!isUnattempted && renderNextButton()}
        </div>
      </div>
    );
  };

  // Update local question/difficulty states whenever concept changes
  useEffect(() => {
    setQuestionTypes(concept.question_types as QuestionType[]);
    setDifficulties(concept.difficulties as QuizDifficulty[]);
  }, [concept]);

  // Navigate to the next unattempted question exactly once per concept group
  useEffect(() => {
    if (
      questions &&
      studyGuideAnswers &&
      navigatedGroupId !== concept.group_id
    ) {
      handleNext();
      setNavigatedGroupId(concept.group_id);
    }
  }, [
    questions,
    studyGuideAnswers,
    concept.group_id,
    navigatedGroupId,
    handleNext,
    setNavigatedGroupId,
  ]);

  // reset value of frqAnswer when the question changes
  useEffect(() => {
    setFrqAnswer("");
  }, [currentQuestion]);

  if (
    isLoading ||
    isLoadingAnswers ||
    isStudyGuideLimitLoading ||
    isLoadingStudyGuideAnswer ||
    isLoadingFetchedContent ||
    isRegeneratingStudyGuide
  ) {
    return (
      <div className="mt-24 h-full w-full flex items-center justify-center">
        <div>
          <span className="text-shimmer">
            {t("quizzes.generatingPractice")}
          </span>
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto overscroll-y-none p-2">
        <div className={cn("flex w-full justify-between")}>
          {renderBackButton()}
        </div>
        <div className="text-muted-foreground text-center mt-4">
          {t("noQuestionsFound")}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto overscroll-y-none relative h-full md:h-[calc(100vh-150px)] flex flex-col">
      <div className={cn("flex w-full justify-between")}>
        {renderBackButton()}
        {renderPreferences()}
      </div>
      {renderProgress()}
      <div
        className={cn(
          "w-full flex flex-col lg:flex-row justify-center",
          "space-x-2",
        )}
      >
        <div className={cn("bg-transparent", "w-full")}>
          <div className="w-full relative">
            <StudyGuideQuestionCard
              ref={carouselRef}
              question={questions[currentIndex]}
              submitAnswer={handleSubmitAnswer}
              frqAnswer={frqAnswer}
              setFrqAnswer={(answer: string) => setFrqAnswer(answer)}
              answer={latestCurrentStudyGuideAnswer}
              answerStatus={answerStatus as AnswerStatus}
              isAnswerSubmitting={isSubmittingAnswer}
              tryAgainLabel={
                (currentQuestion &&
                  incorrectAnswers.some(
                    (answer) => answer.question.id === currentQuestion._id,
                  )) ||
                false
              }
              recordingState={recordingState}
              startRecording={startRecording}
              stopAndTranscribe={handleStopAndTranscribe}
              cancelRecording={cancelRecording}
            />
            {(!isUnattempted || isSubmittingAnswer) && (
              <div className="px-1.5">
                <ResultStatus
                  status={answerStatus}
                  isLoading={isSubmittingAnswer}
                  question={currentQuestion as Question}
                  answer={latestCurrentStudyGuideAnswer as StudyGuideAnswer}
                  contentType={contentType as ContentType}
                />
              </div>
            )}
            <div className="mt-3 px-2">{renderNavigateButtons()}</div>
          </div>
          <Separator className="my-4 h-[1.5px]" />
          <div key="chat-messages" className="rounded-none overflow-y-auto">
            <ChatMessages chats={filteredChats} isStreaming={isStreaming} />
          </div>
          {renderChatQuestions(CHAT_QUESTIONS)}
          <ChatSubmit
            isSubmitting={isSubmitting}
            handleSubmit={handleChatSubmit}
            className="mt-0"
          />
        </div>
      </div>
    </div>
  );
};

export default memo(StudyGuidePractice);
