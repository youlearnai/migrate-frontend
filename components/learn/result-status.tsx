import React from "react";
import {
  AnswerStatus,
  StudyGuideAnswer,
  Question,
  QuestionType,
  ContentType,
  FRQQuestion,
  GenUiQuizQuestion,
  GenUiQuizQuestionAnswer,
  FIBQuestion,
} from "@/lib/types";
import {
  FIBExplanationSkeleton,
  FRQExplanationSkeleton,
  MCQExplanationSkeleton,
  TFExplanationSkeleton,
} from "../skeleton/study-guide-skeleton";
import { useTranslation } from "react-i18next";
import { cn, convertStringToBbox, formatMilliseconds } from "@/lib/utils";
import { useSourceStore } from "@/hooks/use-source-store";
import { Badge } from "../ui/badge";
import { CircleHelp, CircleX, Info, MessageSquareQuote } from "lucide-react";
import { CircleCheck } from "lucide-react";
import Markdown from "../global/markdown";
import { isAudioType, isVideoType } from "@/lib/utils";

const getBgColor = (status: AnswerStatus, isLoading: boolean) => {
  if (isLoading) {
    return "bg-muted";
  }
  switch (status) {
    case "markedComplete":
    case "correct":
      return "bg-green-500/10";
    case "incorrect":
      return "bg-red-500/10";
    case "dontKnow":
      return "bg-yellow-500/10";
  }
};

const getTextColor = (status: AnswerStatus, isLoading: boolean) => {
  if (isLoading) {
    return "text-muted-foreground";
  }
  switch (status) {
    case "markedComplete":
    case "correct":
      return "text-green-600 dark:text-green-400";
    case "incorrect":
      return "text-red-600 dark:text-red-400";
    case "dontKnow":
      return "text-yellow-600 dark:text-yellow-400";
  }
  return "text-foreground";
};

const getBorderColor = (status: AnswerStatus, isLoading: boolean) => {
  if (isLoading) {
    return "border-muted-foreground";
  }
  switch (status) {
    case "markedComplete":
    case "correct":
      return "border-green-500/10";
    case "incorrect":
      return "border-red-500/10";
    case "dontKnow":
      return "border-yellow-500/10";
  }
  return "border-foreground";
};

const ResultStatus = ({
  status,
  isLoading,
  question,
  answer,
  contentType,
}: {
  status: AnswerStatus;
  isLoading: boolean;
  question: Question | GenUiQuizQuestion;
  answer: StudyGuideAnswer | GenUiQuizQuestionAnswer;
  contentType?: ContentType;
}) => {
  const { t } = useTranslation();
  const { onSource } = useSourceStore();
  const questionType = question.question_type;

  const isDontKnow = status === "dontKnow";
  const isIncorrect = status === "incorrect";
  const isCompleted = status === "correct";
  const isMarkedComplete = status === "markedComplete";
  const isAttempted = isCompleted || isIncorrect;
  const isCorrect = isCompleted || isMarkedComplete;

  const shouldShowExplanation = isDontKnow || isIncorrect;
  const score = answer?.score;

  const renderSource = (source: string, bboxValue?: string) => {
    const bbox = bboxValue
      ? convertStringToBbox(bboxValue as string)
      : undefined;

    return (
      <Badge
        key={`source-badge-${source}`}
        variant="outline"
        className={cn(
          "cursor-pointer font-medium text-xs rounded-sm",
          getBgColor(status, isLoading),
          getBorderColor(status, isLoading),
          getTextColor(status, isLoading),
        )}
        onClick={() => {
          onSource(Number.parseFloat(source as string), bbox);
        }}
      >
        {contentType && (isVideoType(contentType) || isAudioType(contentType))
          ? formatMilliseconds(Number.parseFloat(source as string))
          : t("flashcards.page") + " " + parseInt(source as string)}
      </Badge>
    );
  };

  const renderAnswerStatus = () => {
    let icon;
    let text;

    switch (true) {
      case isIncorrect:
        icon = <CircleX className="w-5 h-5" />;
        text = t("incorrect");
        break;
      case shouldShowExplanation:
        icon = <CircleHelp className="w-5 h-5" />;
        text = t("dontKnow");
        break;
      case isMarkedComplete:
        icon = <CircleCheck className="w-5 h-5" />;
        text = t("markComplete");
        break;
      case isCompleted:
        icon = <CircleCheck className="w-5 h-5" />;
        text = t("correct");
        break;
    }

    return (
      <div className="flex items-center gap-2 mb-2">
        <h3
          className={cn(
            "font-medium flex items-center gap-2",
            getTextColor(status, isLoading),
          )}
        >
          {icon}
          {text}
        </h3>
      </div>
    );
  };

  const renderAcceptableAnswers = () => {
    const acceptableAnswers = (question as FIBQuestion).answer;
    return (
      <div
        className={cn(
          "mt-4 flex gap-2 leading-relaxed font-normal flex-col",
          getTextColor(status, isLoading),
        )}
      >
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4" />
          <span className="font-medium capitalize">{t("correctAnswers")}</span>
        </div>
        <div className="flex gap-2">
          {acceptableAnswers.map((answer, index) => (
            <div
              className={cn(
                "flex items-center bg-card rounded-md px-2 py-1 gap-2 text-sm",
                getBgColor(status, isLoading),
                getBorderColor(status, isLoading),
                getTextColor(status, isLoading),
              )}
              key={index}
            >
              {answer}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderExplanation = () => {
    return (
      <div
        className={cn(
          "text-muted-foreground mt-4 text-sm leading-relaxed font-normal",
          getTextColor(status, isLoading),
        )}
      >
        <Markdown className="text-sm leading-normal">
          {question.explanation}
        </Markdown>
        {question.source && contentType && (
          <span className="items-center">
            {renderSource(question.source.toString(), question.bbox)}
          </span>
        )}
      </div>
    );
  };

  const renderScore = () => {
    return (
      <div
        className={cn(
          "mb-4 text-base font-medium",
          getTextColor(status, isLoading),
        )}
      >
        {t("score")}: {Math.floor(((score as number) / 100) * 4)}/4
      </div>
    );
  };

  const renderFeedback = () => {
    return (
      <div className={cn(getTextColor(status, isLoading))}>
        <h3 className="font-medium text-base mb-2 flex items-center gap-2">
          <MessageSquareQuote className="w-5 h-5" />
          {t("accountMenu.feedback")}
        </h3>
        <Markdown className="mb-4 text-sm leading-normal">
          {answer.feedback}
        </Markdown>
      </div>
    );
  };

  const renderAnswer = () => {
    let icon;
    let text;

    switch (status) {
      case "incorrect":
        if (answer.score < 25) {
          icon = <CircleX className="w-5 h-5" />;
        } else if (answer.score < 75) {
          icon = <CircleHelp className="w-5 h-5" />;
        } else {
          icon = <CircleCheck className="w-5 h-5" />;
        }
        text = t("flashcards.answer");
        break;
      case "dontKnow":
        icon = <CircleHelp className="w-5 h-5" />;
        text = t("dontKnow");
        break;
      case "correct":
      case "markedComplete":
        icon = <CircleCheck className="w-5 h-5" />;
        text = t("markedComplete");
        break;
    }

    return (
      <div className={cn(getTextColor(status, isLoading))}>
        <h3 className="font-medium text-base mb-2 flex items-center gap-2">
          {icon}
          {text}
        </h3>
        <div>
          <Markdown className="text-sm leading-normal">
            {(question as FRQQuestion).answer}
          </Markdown>
          {question.source && contentType && (
            <span className="inline-flex items-center gap-2 ml-2">
              {renderSource(question.source.toString(), question.bbox)}
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderMCQStatus = () => {
    return (
      <div>
        {isLoading && <MCQExplanationSkeleton />}
        {!isLoading && (
          <>
            {renderAnswerStatus()}
            {renderExplanation()}
          </>
        )}
      </div>
    );
  };

  const renderFreeResponseStatus = () => {
    return (
      <div>
        {isLoading && <FRQExplanationSkeleton />}
        {!isLoading && (
          <>
            {isAttempted && renderScore()}
            {isAttempted && renderFeedback()}
            {renderAnswer()}
          </>
        )}
      </div>
    );
  };

  const renderTFStatus = () => {
    return (
      <div>
        {isLoading && <TFExplanationSkeleton />}
        {!isLoading && (
          <>
            {renderAnswerStatus()}
            {renderExplanation()}
          </>
        )}
      </div>
    );
  };

  const renderFIBStatus = () => {
    return (
      <div>
        {isLoading && <FIBExplanationSkeleton />}
        {!isLoading && (
          <>
            {renderAnswerStatus()}
            {renderExplanation()}
            {!isCorrect && renderAcceptableAnswers()}
          </>
        )}
      </div>
    );
  };

  const renderQuestionStatus = () => {
    switch (questionType) {
      case "multiple_choice":
        return renderMCQStatus();
      case "free_response":
        return renderFreeResponseStatus();
      case "true_false":
        return renderTFStatus();
      case "fill_in_blanks":
        return renderFIBStatus();
    }
  };

  return (
    <div className={cn("mt-4 p-4 rounded-lg", getBgColor(status, isLoading))}>
      {renderQuestionStatus()}
    </div>
  );
};

export default ResultStatus;
