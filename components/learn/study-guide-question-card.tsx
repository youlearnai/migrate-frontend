import { cn } from "@/lib/utils";
import {
  FIBQuestion,
  MCQQuestion,
  StudyGuideQuestionCardProps,
  TFQuestion,
} from "@/lib/types";
import React from "react";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import { Trash, Loader2, Mic } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Textarea } from "../ui/textarea";
import { useDeleteStudyGuideQuestion } from "@/query-hooks/content";
import { useStudyGuideStore } from "@/hooks/use-study-guide-store";
import { Badge } from "../ui/badge";
import Markdown from "../global/markdown";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { X, Check } from "lucide-react";
import FillInBlankQuestion from "./fill-in-blank-question";

const StudyGuideQuestionCard = React.forwardRef<
  HTMLDivElement,
  StudyGuideQuestionCardProps
>((props, ref) => {
  const { t } = useTranslation();
  const {
    question,
    submitAnswer,
    frqAnswer,
    setFrqAnswer,
    answer,
    answerStatus,
    isAnswerSubmitting,
    tryAgainLabel,
    recordingState,
    startRecording: startRecordingProp,
    stopAndTranscribe: stopAndTranscribeProp,
    cancelRecording: cancelRecordingProp,
  } = props;
  const { setView, setData, data } = useStudyGuideStore();
  const questionType = question?.question_type;
  const isCorrect = answerStatus === "correct";
  const isIncorrect = answerStatus === "incorrect";
  const isDontKnow = answerStatus === "dontKnow";
  const isMarkedComplete = answerStatus === "markedComplete";
  const isUnattempted = answerStatus === "unattempted";
  const { mutate: deleteQuestion, isPending: isDeletingQuestion } =
    useDeleteStudyGuideQuestion();

  const startRecording = () => startRecordingProp();

  const stopAndTranscribe = () => {
    stopAndTranscribeProp();
  };

  const cancelRecording = () => cancelRecordingProp();

  const mcqStyles = (i: number, correctOptionIdx: number) => {
    const selectedOption = parseInt(answer?.answer as string);
    const isCurrentQuestionAnswered = answerStatus !== "unattempted";

    return cn(
      "w-full justify-start border-1.5 text-left items-start whitespace-normal h-auto py-4 text-sm font-normal hover:bg-transparent rounded-2xl",
      (isCorrect || isMarkedComplete) &&
        i === correctOptionIdx &&
        "border-2 border-green-500",
      isIncorrect &&
        i === correctOptionIdx &&
        "border-2 border-green-500 border-dashed",
      isIncorrect && i === selectedOption && "border-2 border-red-500",
      isDontKnow &&
        i === correctOptionIdx &&
        "border-2 border-yellow-500 border-dashed",
      isAnswerSubmitting && "border-muted/50",
      isUnattempted && "hover:border-muted-foreground/40",
    );
  };

  const renderTryAgainLabel = () => {
    if (tryAgainLabel) {
      return (
        <Badge className="rounded-3xl bg-yellow-500/20 hover:bg-yellow-500/20 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400 py-0 dark:hover:bg-yellow-500/20 border-yellow-500/30">
          {t("forgetPassword.tryAgain")}
        </Badge>
      );
    }
  };

  const renderMCQQuestion = () => {
    const mcqQuestion = question as MCQQuestion;
    return (
      <div className="space-y-3">
        {mcqQuestion.options.map((option: string, i: number) => {
          return (
            <Button
              key={i}
              variant="outline"
              className={mcqStyles(i, mcqQuestion.correct_option_idx)}
              onClick={() => {
                submitAnswer(i.toString());
              }}
              disabled={!isUnattempted}
            >
              <span className="mr-2">{String.fromCharCode(65 + i)}.</span>
              <Markdown className="flex-1">{option}</Markdown>
            </Button>
          );
        })}
      </div>
    );
  };

  const renderDictateButton = () => {
    if (recordingState === "recording") {
      return (
        <div className="flex gap-0.5">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelRecording}
                  className="rounded-lg p-1 h-fit"
                >
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("chat.cancelRecording")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={stopAndTranscribe}
                  className="rounded-lg p-1 h-fit"
                >
                  <Check className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("chat.doneDictating")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    }

    if (recordingState === "processing") {
      return (
        <Button size="icon" variant="outline" disabled>
          <Loader2 className="h-4 w-4 animate-spin" />
        </Button>
      );
    }

    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              disabled={isAnswerSubmitting || isMarkedComplete}
              onClick={startRecording}
              className="rounded-lg p-1 h-fit md:text-muted-foreground hover:text-primary text-primary"
            >
              <Mic className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("chat.dictate")}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const renderFRQQuestion = () => {
    if (recordingState === "recording") {
      return (
        <div className="w-full px-4 py-3 border rounded-2xl flex-grow min-h-[125px] flex flex-col justify-center relative">
          <div className="px-2 mb-1">
            <canvas
              data-study-guide-voice-canvas="true"
              className="w-full h-12"
            />
          </div>
          <div className="absolute bottom-1 right-1">
            {renderDictateButton()}
          </div>
        </div>
      );
    }

    if (recordingState === "processing") {
      return (
        <div className="w-full px-4 py-3 border rounded-2xl flex-grow min-h-[125px] flex flex-col items-center justify-center">
          <div className="flex items-center justify-center text-primary/70">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm">{t("chat.processingAudio")}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="relative">
        <Textarea
          className="w-full px-4 py-3 border rounded-2xl text-sm font-normal leading-relaxed flex-grow min-h-[125px] resize-none"
          placeholder={t("studyGuide.typeAnswer")}
          value={answer?.answer || frqAnswer || ""}
          onChange={(e) => setFrqAnswer(e.target.value)}
          disabled={!isUnattempted}
        />
        <div className="absolute bottom-0 right-1">{renderDictateButton()}</div>
      </div>
    );
  };

  const renderTFQuestion = () => {
    const tfQuestion = question as TFQuestion;
    const selectedAnswer =
      answer?.answer === "true" || answer?.answer === "false"
        ? answer.answer
        : null;
    const correctAnswer = tfQuestion.answer;

    const tfStyles = (isTrue: boolean) => {
      const isSelected = selectedAnswer === isTrue.toString();
      const isCorrectOption = correctAnswer === isTrue;

      return cn(
        "w-full justify-start border-1.5 text-left items-center whitespace-normal h-auto py-4 text-sm font-normal hover:bg-transparent rounded-2xl",
        (isCorrect || isMarkedComplete) &&
          isCorrectOption &&
          "border-2 border-green-500",
        isIncorrect &&
          isCorrectOption &&
          "border-2 border-green-500 border-dashed",
        isIncorrect &&
          isSelected &&
          !isCorrectOption &&
          "border-2 border-red-500",
        isDontKnow &&
          isCorrectOption &&
          "border-2 border-yellow-500 border-dashed",
        isAnswerSubmitting && "border-muted/50",
        isUnattempted && "hover:border-muted-foreground/40",
      );
    };

    return (
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className={tfStyles(true)}
          onClick={() => submitAnswer("true")}
          disabled={!isUnattempted}
        >
          <Check className="h-4 w-4 mr-2" />
          {t("common.true", "True")}
        </Button>
        <Button
          variant="outline"
          className={tfStyles(false)}
          onClick={() => submitAnswer("false")}
          disabled={!isUnattempted}
        >
          <X className="h-4 w-4 mr-2" />
          {t("common.false", "False")}
        </Button>
      </div>
    );
  };

  const renderFIBQuestion = () => {
    const fibQuestion = question as FIBQuestion;

    const currentAnswer = frqAnswer || answer?.answer || "";

    return (
      <div className="w-full flex justify-between">
        <FillInBlankQuestion
          question={fibQuestion}
          answer={currentAnswer}
          onAnswerChange={setFrqAnswer}
          answerStatus={answerStatus}
          isDisabled={!isUnattempted}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 ml-2 flex-shrink-0 hover:text-destructive"
          onClick={handleDeleteQuestion}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  const renderQuestion = () => {
    switch (questionType) {
      case "multiple_choice":
        return renderMCQQuestion();
      case "free_response":
        return renderFRQQuestion();
      case "true_false":
        return renderTFQuestion();
      case "fill_in_blanks":
        return renderFIBQuestion();
    }
  };

  const handleDeleteQuestion = () => {
    deleteQuestion({
      contentId: question.content.id as string,
      questionIds: [question._id],
    });
  };

  if (!question || isDeletingQuestion) {
    return <Skeleton className={cn("flex-1 w-full h-[350px]")} />;
  }

  return (
    <div
      ref={ref}
      className={cn("w-full h-full overflow-y-auto rounded-lg")}
      role="region"
      aria-roledescription="carousel"
    >
      <div className="p-2">
        <div
          className={cn(
            "flex items-center justify-between mb-4",
            questionType === "fill_in_blanks" && "mb-0 hidden",
          )}
        >
          <h2 className="text-md font-normal items-center space-x-2 leading-relaxed flex-1">
            <Markdown>{question.question}</Markdown>
            <span>{renderTryAgainLabel()}</span>
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 ml-2 flex-shrink-0 hover:text-destructive"
            onClick={handleDeleteQuestion}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
        {renderQuestion()}
      </div>
    </div>
  );
});

StudyGuideQuestionCard.displayName = "StudyGuideQuestionCard";

export default StudyGuideQuestionCard;
