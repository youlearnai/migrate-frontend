import {
  Content,
  GenUiQuizData,
  GenUiQuizQuestionAnswer,
  QuizResponseChunk,
} from "@/lib/types";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import GenUiQuizCard from "./genui-quiz-card";
import { useTranslation } from "react-i18next";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { ArrowLeft, ArrowRight, Check, RotateCcw } from "lucide-react";
import {
  useCreateQuizAnswerFeedbackGenerations,
  useDeleteQuizAnswerGenerations,
} from "@/query-hooks/generation";
import ResultStatus from "./result-status";
import { useParams } from "next/navigation";
import { useGenUiVoiceRecording } from "@/hooks/use-gen-ui-voice-recording";

const GenUiQuiz = ({
  chunk,
  chatMessageId,
  content,
}: {
  chunk: QuizResponseChunk;
  chatMessageId: string;
  content?: Content;
}) => {
  const params = useParams();
  const spaceId = params.spaceId as string;
  const [clientSide, setClientSide] = useState<boolean>(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const [frqAnswer, setFrqAnswer] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [wasInitiallyCompleted, setWasInitiallyCompleted] = useState(false);
  const { mutate: createQuizAnswerFeedback, isPending: isSubmittingAnswer } =
    useCreateQuizAnswerFeedbackGenerations();
  const { mutate: deleteQuizAnswer, isPending: isDeletingAnswer } =
    useDeleteQuizAnswerGenerations();
  const [genUiQuizData, setGenUiQuizData] = useState<GenUiQuizData>({
    view: "practice",
    currentIndex: 0,
  });
  const currentIndex = genUiQuizData.currentIndex;
  const currentQuestion = chunk.questions?.[currentIndex];
  const currentAnswer =
    currentQuestion?.idx !== undefined
      ? chunk.answers[currentQuestion.idx]
      : undefined;
  const isLastQuestion = currentIndex === chunk.questions.length - 1;
  const completedAnswers = Object.values(chunk.answers).length;
  const { recordingState, startRecording, stopAndTranscribe, cancelRecording } =
    useGenUiVoiceRecording();

  const handleStopAndTranscribe = () => {
    stopAndTranscribe((text: string) => {
      setFrqAnswer(frqAnswer + " " + text);
    });
  };

  // Handle empty questions array
  if (!chunk?.questions || chunk?.questions?.length === 0) {
    return (
      <div className="w-full h-[250px] flex flex-col space-y-2 items-center justify-center relative my-3 border rounded-2xl px-4 py-3 pb-5 bg-neutral-100/20 dark:bg-neutral-800/50 dark:border-primary/10">
        <span className="text-muted-foreground">
          {t("noQuestionsGenerated")}
        </span>
      </div>
    );
  }

  const answerStatus = useMemo(() => {
    if (currentAnswer?.is_completed) {
      return "markedComplete";
    }

    if (currentAnswer?.score === 100) {
      return "correct";
    }

    if (currentAnswer?.answer === null && currentAnswer?.score === 0) {
      return "dontKnow";
    }

    if (
      typeof currentAnswer?.score === "number" &&
      currentAnswer?.score >= 0 &&
      currentAnswer?.score < 100 &&
      currentAnswer?.answer !== null
    ) {
      return "incorrect";
    }

    return "unattempted";
  }, [currentAnswer]);

  const isUnattempted = answerStatus === "unattempted";

  const correctAnswers = useMemo(() => {
    const correctAnswers = Object.values(chunk.answers).filter(
      (answer) => answer?.score === 100,
    );
    return correctAnswers.length;
  }, [chunk.answers]);

  const handleTryAgain = () => {
    deleteQuizAnswer(
      {
        chatbotMessageId: chatMessageId,
        ...(chunk.quiz_id && { quizId: chunk.quiz_id }),
        spaceId,
      },
      {
        onSuccess: () => {
          setIsCompleted(false);
          setGenUiQuizData({
            ...genUiQuizData,
            currentIndex: 0,
            view: "practice",
          });
        },
      },
    );
  };

  const handleSubmitAnswer = useCallback(
    (answer: string | undefined, isCompleted?: boolean) => {
      createQuizAnswerFeedback(
        {
          chatbotMessageId: chatMessageId,
          questionIdx: currentQuestion?.idx,
          answer: answer,
          isCompleted: isCompleted || false,
          ...(chunk.quiz_id && { quizId: chunk.quiz_id }),
        },
        {
          onSuccess: (response) => {
            setFrqAnswer("");
          },
        },
      );
    },
    [
      chatMessageId,
      currentQuestion?.idx,
      createQuizAnswerFeedback,
      chunk.quiz_id,
    ],
  );

  const onComplete = () => {
    setIsCompleted(true);
  };

  const handleNext = () => {
    if (currentIndex < chunk.questions.length - 1) {
      setGenUiQuizData({ ...genUiQuizData, currentIndex: currentIndex + 1 });
    } else {
      onComplete();
    }
  };

  const handleRetry = () => {
    deleteQuizAnswer({
      chatbotMessageId: chatMessageId,
      questionIdx: currentQuestion?.idx,
      ...(chunk.quiz_id && { quizId: chunk.quiz_id }),
      spaceId,
    });
  };

  const handleMarkComplete = () => {
    handleSubmitAnswer(undefined, true);
  };

  const handleDontKnow = () => {
    handleSubmitAnswer(undefined);
  };

  const handleViewAnswers = () => {
    setIsCompleted(false);
    setGenUiQuizData({ ...genUiQuizData, view: "display", currentIndex: 0 });
  };

  const renderRetryButton = () => {
    const isRecordingOrProcessing =
      recordingState === "recording" || recordingState === "processing";
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleRetry}
              variant="outline"
              size="icon"
              disabled={isRecordingOrProcessing}
              className="bg-neutral-100/20 dark:bg-neutral-800/50 dark:border-primary/10 hover:bg-neutral-100 hover:border-neutral-300 dark:hover:bg-neutral-800 dark:hover:border-neutral-700"
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

  const renderTryAgainButton = () => {
    return (
      <Badge className="rounded-3xl ml-2 bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/30 dark:bg-yellow-500/20 dark:text-yellow-400 dark:hover:bg-yellow-500/30 py-0 border-yellow-500/30">
        {t("forgetPassword.tryAgain")}
      </Badge>
    );
  };

  const renderDontKnowButton = () => {
    const isRecordingOrProcessing =
      recordingState === "recording" || recordingState === "processing";
    return (
      <Button
        onClick={handleDontKnow}
        variant="outline"
        disabled={isRecordingOrProcessing}
        className="bg-neutral-100/20 dark:bg-neutral-800/50 dark:border-primary/10 hover:bg-neutral-100 hover:border-neutral-300 dark:hover:bg-neutral-800 dark:hover:border-neutral-700"
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
    if (genUiQuizData.view === "display") {
      return (
        <Button
          variant="outline"
          onClick={handleNext}
          className="bg-neutral-100/20 dark:bg-neutral-800/50 dark:border-primary/10 hover:bg-neutral-100 hover:border-neutral-300 dark:hover:bg-neutral-800 dark:hover:border-neutral-700"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      );
    }

    return (
      <Button onClick={handleNext}>
        {isLastQuestion ? t("complete") : t("boardPagination.next")}
      </Button>
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
              onClick={handleMarkComplete}
              variant="outline"
              size="icon"
              disabled={isRecordingOrProcessing}
              className="bg-neutral-100/20 dark:bg-neutral-800/50 dark:border-primary/10 hover:bg-neutral-100 hover:border-neutral-300 dark:hover:bg-neutral-800 dark:hover:border-neutral-700"
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

  const handleBack = () => {
    setGenUiQuizData({ ...genUiQuizData, currentIndex: currentIndex - 1 });
  };

  const renderBackButton = () => {
    return (
      <Button
        variant="outline"
        className="bg-neutral-100/20 dark:bg-neutral-800/50 dark:border-primary/10 hover:bg-neutral-100 hover:border-neutral-300 dark:hover:bg-neutral-800 dark:hover:border-neutral-700"
        onClick={handleBack}
        disabled={currentIndex === 0}
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
    );
  };

  const renderQuestionProgress = () => {
    return (
      <span className="text-sm flex-shrink-0 font-medium text-muted-foreground">
        {currentIndex + 1} / {chunk.questions.length}
      </span>
    );
  };

  const renderNavigateButtons = () => {
    if (genUiQuizData.view === "display") {
      return (
        <div className="flex justify-between space-x-2">
          <div className="flex space-x-2 w-full items-center justify-between">
            {renderBackButton()}
            {renderQuestionProgress()}
            {renderNextButton()}
          </div>
        </div>
      );
    }

    return (
      <div className="flex justify-between space-x-2 items-center">
        <div className="flex space-x-2">
          {renderRetryButton()}
          {renderMarkCompletedButton()}
        </div>
        {renderQuestionProgress()}
        <div className="flex space-x-2 ml-2">
          {renderDontKnowButton()}
          {isUnattempted &&
            currentQuestion?.question_type === "free_response" &&
            renderSubmitButton()}
          {!isUnattempted && renderNextButton()}
        </div>
      </div>
    );
  };

  const renderTotalScore = () => {
    return (
      <span>
        <span>{t("totalScore")}</span>: {correctAnswers} /{" "}
        {chunk.questions.length}
      </span>
    );
  };

  useEffect(() => {
    setClientSide(true);
  }, []);

  // Check if quiz was already completed on initial load
  useEffect(() => {
    if (completedAnswers === chunk.questions.length) {
      setWasInitiallyCompleted(true);
    }
  }, []);

  // Only auto-complete if quiz was already completed when component loaded
  useEffect(() => {
    if (wasInitiallyCompleted && completedAnswers === chunk.questions.length) {
      setIsCompleted(true);
    }
  }, [wasInitiallyCompleted, completedAnswers, chunk.questions.length]);

  // If the isCompleted state is true, set the current index to the last completed answer + 1
  useEffect(() => {
    if (clientSide && completedAnswers > 0) {
      setGenUiQuizData({ ...genUiQuizData, currentIndex: completedAnswers });
    }
  }, [clientSide, setGenUiQuizData]);

  if (isCompleted) {
    return (
      <div className="w-full h-[250px] flex flex-col space-y-2 items-center justify-center relative my-3 border rounded-2xl px-4 py-3 pb-5 bg-neutral-100/20 dark:bg-neutral-800/50 dark:border-primary/10">
        {renderTotalScore()}
        <div className="flex space-x-2 mt-2">
          <Button
            variant="outline"
            className="gap-2 bg-neutral-100/20 dark:bg-neutral-800/50 dark:border-primary/10 hover:bg-neutral-100 hover:border-neutral-300 dark:hover:bg-neutral-800 dark:hover:border-neutral-700"
            onClick={handleViewAnswers}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t("viewAnswers")}</span>
          </Button>
          <Button
            className="gap-2"
            onClick={handleTryAgain}
            disabled={isSubmittingAnswer}
          >
            {isSubmittingAnswer ? (
              t("summaryOptionsModal.submitting")
            ) : (
              <>
                <RotateCcw className="h-4 w-4" />
                <span>{t("forgetPassword.tryAgain")}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  if (!clientSide) {
    return null;
  }

  return (
    <div className="w-full relative my-3 border rounded-2xl px-4 py-3 pb-5 bg-neutral-100/20 dark:bg-neutral-800/50">
      <GenUiQuizCard
        ref={carouselRef}
        question={chunk.questions[currentIndex]}
        answer={currentAnswer as GenUiQuizQuestionAnswer}
        frqAnswer={frqAnswer}
        setFrqAnswer={setFrqAnswer}
        onSubmitAnswer={handleSubmitAnswer}
        answerStatus={answerStatus}
        isAnswerSubmitting={isSubmittingAnswer}
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
            question={currentQuestion}
            answer={currentAnswer as GenUiQuizQuestionAnswer}
            contentType={content?.type}
          />
        </div>
      )}
      <div className="mt-4 px-2">{renderNavigateButtons()}</div>
    </div>
  );
};

export default GenUiQuiz;
