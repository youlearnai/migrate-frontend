"use client";
import { cn, convertStringToBbox, formatMilliseconds } from "@/lib/utils";
import {
  BoundingBoxData,
  Content,
  ContentType,
  ExamAnswer,
  ExamQuestion,
  MCQQuestion,
  ModalData,
} from "@/lib/types";
import React, { ChangeEvent, useState, useEffect, useRef } from "react";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import { useTranslation } from "react-i18next";
import { Textarea } from "../ui/textarea";
import {
  ArrowRight,
  CircleCheck,
  CircleHelp,
  CircleX,
  SkipForward,
  Undo2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSaveSpaceExam, useGetSpaceExamAnswers } from "@/query-hooks/exam";
import { useParams, useRouter } from "next/navigation";
import { debounce } from "lodash";
import Markdown from "../global/markdown";
import { Badge } from "../ui/badge";
import { useSourceStore } from "@/hooks/use-source-store";
import { isAudioType, isVideoType } from "@/lib/utils";
import { useSpaceExamQuestionIdStore } from "@/hooks/use-space-exam-question-id-store";
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import { useModalStore } from "@/hooks/use-modal-store";
import { useMediaQuery } from "usehooks-ts";

const getBgColor = (score: number, isSkipped?: boolean) => {
  if (isSkipped) {
    return "bg-muted";
  }
  if (score === 100) {
    return "bg-green-500/10";
  }
  if (score >= 50) {
    return "bg-yellow-500/10";
  }
  if (score < 50) {
    return "bg-red-500/10";
  }
  return "bg-muted-foreground";
};

const getTextColor = (score: number, isSkipped?: boolean) => {
  if (isSkipped) {
    return "text-muted-foreground";
  }
  if (score === 100) {
    return "text-green-600 dark:text-green-400";
  }
  if (score >= 50) {
    return "text-yellow-600 dark:text-yellow-400";
  }
  if (score < 50) {
    return "text-red-600 dark:text-red-400";
  }
  return "text-foreground";
};

const getBorderColor = (score: number, isSkipped?: boolean) => {
  if (isSkipped) {
    return "border-foreground-muted";
  }
  if (score === 100) {
    return "border-green-500/10";
  }
  if (score >= 50) {
    return "border-yellow-500/10";
  }
  if (score < 50) {
    return "border-red-500/10";
  }
  return "border-foreground";
};

const ExamQuestionCard = ({
  question,
  showAnswer,
  answer,
  content,
}: {
  question: ExamQuestion;
  showAnswer: boolean;
  answer: ExamAnswer;
  content: Content;
}) => {
  const params = useParams();
  const { t } = useTranslation();
  const { data: spaceExamAnswers, isLoading: isSpaceExamAnswersLoading } =
    useGetSpaceExamAnswers(params.examId as string);
  const {
    mutate: saveSpaceExamAnswer,
    isPending: isSaveSpaceExamAnswerPending,
  } = useSaveSpaceExam();
  const { onSource } = useSourceStore();
  const contentType = content?.type;
  const router = useRouter();
  const { setQuestionId, setTitle } = useSpaceExamQuestionIdStore();
  const { setIsOpen: setRightSidebarOpen } = useRightSidebar();
  const { onOpen } = useModalStore();
  const isMobile = useMediaQuery("(max-width: 1280px)");

  const handleOpenSpaceChat = () => {
    if (isMobile) {
      onOpen("examChatModal", {
        spaceId: params.spaceId as string,
      } as ModalData);
    } else {
      setRightSidebarOpen(true);
    }
  };

  const score = answer?.score;

  const handleSourceClick = (source: number, bboxValue?: BoundingBoxData) => {
    onSource(source, bboxValue as BoundingBoxData, {
      type: "exam",
      origin: params.examId as string,
    });
    router.push(`/learn/space/${params.spaceId}/content/${content.id}`);
  };

  const renderAnswerStatus = (score: number, isSkipped?: boolean) => {
    let icon;
    let text;

    if (score == 100) {
      icon = <CircleCheck className="w-5 h-5" />;
      text = t("correct");
    }

    if (score < 100) {
      icon = <CircleX className="w-5 h-5" />;
      text = t("incorrect");
    }

    if (isSkipped) {
      icon = <CircleHelp className="w-5 h-5" />;
      text = t("skipped");
    }

    return (
      <div className="flex gap-2 items-center">
        <h3
          className={cn(
            "font-medium flex items-center gap-2",
            getTextColor(score, isSkipped),
          )}
        >
          {icon}
          {text}
        </h3>
      </div>
    );
  };

  const currentAnswer = spaceExamAnswers?.answers.find(
    (answer) =>
      answer.question.id === question._id ||
      answer.question._id === question._id,
  );

  const isSkipped = currentAnswer?.is_skipped || false;
  const [frqAnswer, setFrqAnswer] = useState(currentAnswer?.answer || "");
  const [optimisticSelectedOption, setOptimisticSelectedOption] = useState<
    number | null
  >(
    currentAnswer?.answer !== null && currentAnswer?.answer !== undefined
      ? parseInt(currentAnswer.answer as string)
      : null,
  );

  const debouncedSaveFrq = useRef(
    debounce(
      (newAnswer: string, currentServerAnswer: string, isPending: boolean) => {
        if (isPending || newAnswer === currentServerAnswer) {
          return;
        }

        saveSpaceExamAnswer({
          examId: params.examId as string,
          questionId: question._id,
          answer: newAnswer,
          isSkipped: false,
        });
      },
      1000,
    ),
  ).current;

  const handleQuestionIdChat = () => {
    setQuestionId(question._id);
    setTitle(question.question);
    handleOpenSpaceChat();
  };

  const handleSaveSpaceExamAnswer = (
    answer: string | null,
    isSkipped = false,
  ) => {
    saveSpaceExamAnswer({
      examId: params.examId as string,
      questionId: question._id,
      answer,
      isSkipped,
    });
  };

  const handleMcqOptionClick = (optionIdx: number) => {
    const newAnswer = String(optionIdx);
    if (newAnswer === currentAnswer?.answer) {
      handleSaveSpaceExamAnswer(null, false);
      return;
    }

    setOptimisticSelectedOption(optionIdx);

    handleSaveSpaceExamAnswer(newAnswer);
  };

  const handleFrqChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setFrqAnswer(newValue);

    const serverAnswer = currentAnswer?.answer || "";
    debouncedSaveFrq(newValue, serverAnswer, isSaveSpaceExamAnswerPending);
  };

  const handleSkipQuestion = () => {
    debouncedSaveFrq.cancel();

    if (isSkipped || isSaveSpaceExamAnswerPending) {
      return;
    }

    setFrqAnswer("");
    handleSaveSpaceExamAnswer(null, true);
  };

  const handleUndoSkip = () => {
    debouncedSaveFrq.cancel();

    if (!isSkipped || isSaveSpaceExamAnswerPending) {
      return;
    }

    const newAnswer = "";
    setFrqAnswer(newAnswer);
    handleSaveSpaceExamAnswer(newAnswer, false);
  };

  const renderMCQQuestion = () => {
    const mcqQuestion = question as MCQQuestion;
    const correctOptionIdx = mcqQuestion.correct_option_idx;
    const selectedOptionIdx =
      optimisticSelectedOption !== null
        ? optimisticSelectedOption
        : currentAnswer?.answer !== null && currentAnswer?.answer !== undefined
          ? parseInt(currentAnswer.answer as string)
          : null;
    const isIncorrect =
      showAnswer &&
      selectedOptionIdx !== null &&
      selectedOptionIdx !== correctOptionIdx;
    const isCorrect =
      showAnswer &&
      selectedOptionIdx !== null &&
      selectedOptionIdx === correctOptionIdx;
    const isUnattempted = showAnswer && !isIncorrect && !isCorrect;

    const mcqStyles = (i: number) => {
      return {
        "border-2 border-red-500": isIncorrect && i === selectedOptionIdx,
        "border-2 border-green-500": isCorrect && i === correctOptionIdx,
        "border-2 border-green-500 border-dashed":
          isIncorrect && i === correctOptionIdx,
        "border-2 border-dashed border-green-500":
          isUnattempted && i === correctOptionIdx,
      };
    };

    return (
      <div className="grid grid-cols-1 gap-2">
        {mcqQuestion.options.map((option: string, i: number) => {
          return (
            <Button
              key={i}
              disabled={showAnswer}
              onClick={() => handleMcqOptionClick(i)}
              variant="outline"
              className={cn(
                "text-primary/90 w-full justify-start space-x-2 border-1.5 text-left items-start whitespace-normal h-auto py-4 text-sm font-normal leading-relaxed",
                selectedOptionIdx === i &&
                  !showAnswer &&
                  "border-primary/50 text-primary",
                selectedOptionIdx !== null &&
                  selectedOptionIdx !== i &&
                  !showAnswer &&
                  "opacity-60",
                showAnswer && mcqStyles(i),
                isSaveSpaceExamAnswerPending &&
                  selectedOptionIdx === i &&
                  "border-primary/50 text-primary",
              )}
            >
              <span>{String.fromCharCode(65 + i)}.</span>
              <Markdown>{option}</Markdown>
            </Button>
          );
        })}
      </div>
    );
  };

  const renderFRQQuestion = () => {
    return (
      <div className="relative">
        <Textarea
          className="w-full px-4 py-3 border rounded-md text-sm font-normal leading-relaxed flex-grow min-h-[125px] resize-none"
          placeholder={t("studyGuide.typeAnswer")}
          value={frqAnswer}
          onChange={handleFrqChange}
          disabled={showAnswer}
        />
        {isSaveSpaceExamAnswerPending && (
          <span className="absolute bottom-3 right-3 text-xs text-muted-foreground">
            Saving...
          </span>
        )}
      </div>
    );
  };

  const renderQuestion = () => {
    switch (question.question_type) {
      case "multiple_choice":
        return renderMCQQuestion();
      case "free_response":
        return renderFRQQuestion();
    }
  };

  const renderSource = (source: string, bboxValue?: string) => {
    const bbox = bboxValue
      ? convertStringToBbox(bboxValue as string)
      : undefined;

    return (
      <Badge
        key={`source-badge-${source}`}
        variant="outline"
        className={cn(
          "cursor-pointer space-x-2 font-medium text-xs rounded-sm mt-2",
          showAnswer && getBgColor(score, isSkipped),
          showAnswer && getBorderColor(score, isSkipped),
          showAnswer && getTextColor(score, isSkipped),
        )}
        onClick={() => handleSourceClick(Number(source), bbox)}
      >
        <span>
          {isVideoType(contentType as ContentType) ||
          isAudioType(contentType as ContentType)
            ? formatMilliseconds(Number.parseFloat(source as string))
            : t("flashcards.page") + " " + parseInt(source as string)}
        </span>
        :
        {question.key_concept && (
          <span className="max-w-[10rem] truncate">
            {question.key_concept.concept}
          </span>
        )}
      </Badge>
    );
  };

  const renderScore = () => {
    return (
      <div
        className={cn("text-base font-medium", getTextColor(score, isSkipped))}
      >
        {t("score")}: {Math.floor(((score as number) / 100) * 4)}/4
      </div>
    );
  };

  const renderQuestionStatus = () => {
    switch (question.question_type) {
      case "multiple_choice":
        return renderMCQStatus();
      case "free_response":
        return renderFreeResponseStatus();
    }
  };

  const renderMCQStatus = () => {
    return (
      <div className="flex flex-col">
        {renderAnswerStatus(score, isSkipped)}
        {renderAnswer()}
      </div>
    );
  };

  const renderFreeResponseStatus = () => {
    return (
      <div className="flex flex-col">
        {renderAnswerStatus(score, isSkipped)}
        <div className="flex gap-4 items-center mt-2">{renderScore()}</div>
        {renderAnswer()}
      </div>
    );
  };

  const renderAnswer = () => {
    return (
      <div
        className={cn(
          "text-muted-foreground mt-2 text-sm leading-relaxed font-normal",
          showAnswer && getTextColor(score, isSkipped),
        )}
      >
        <Markdown className="text-sm leading-normal">
          {question.explanation}
        </Markdown>
        {question.source && (
          <span className="items-center">
            {renderSource(question.source.toString(), question.bbox)}
          </span>
        )}
      </div>
    );
  };

  const renderQuestionIdChat = () => {
    return (
      <Button
        onClick={handleQuestionIdChat}
        variant="outline"
        className="gap-x-2"
        size="sm"
      >
        <span>{t("askChat")}</span>
        <ArrowRight className="w-4 h-4" />
      </Button>
    );
  };

  // Optimistically update UI
  useEffect(() => {
    if (currentAnswer?.answer !== null && currentAnswer?.answer !== undefined) {
      setOptimisticSelectedOption(parseInt(currentAnswer.answer as string));
    } else {
      setOptimisticSelectedOption(null);
    }
  }, [currentAnswer?.answer]);

  if (!question || isSpaceExamAnswersLoading) {
    return <Skeleton className={cn("flex-1 w-full h-[350px]")} />;
  }

  return (
    <div
      className={cn(
        "w-full h-full overflow-y-auto rounded-lg",
        isSkipped && "opacity-70",
        showAnswer && "opacity-100",
      )}
      role="region"
      aria-roledescription="carousel"
    >
      <div className="p-2">
        <div className="flex items-center justify-between mb-4 gap-2">
          <h2 className="text-md font-normal leading-relaxed flex-1">
            <span>{question.idx}.</span>{" "}
            <Markdown>{question.question}</Markdown>
          </h2>
          <div className="items-end">
            {showAnswer && renderQuestionIdChat()}
          </div>
          {/* Desktop Skip Button - shown only sm breakpoint and above */}
          {!showAnswer && !isSkipped && (
            <div className="hidden sm:block">
              {" "}
              {/* Wrapper div */}
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className="space-x-2 text-muted-foreground"
                      disabled={isSaveSpaceExamAnswerPending}
                      onClick={handleSkipQuestion}
                    >
                      <SkipForward className="h-4 w-4" />
                      <span>{t("common2.skip")}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="p-3">
                    <p>{t("examQuestionCard.skipTooltip")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
        {!showAnswer && isSkipped ? (
          <div className="flex items-center justify-center">
            <Button
              variant="outline"
              onClick={handleUndoSkip}
              disabled={isSaveSpaceExamAnswerPending}
              className="sm:mt-4 rounded-full gap-x-2 text-primary px-6 justify-center space-x-2 border-1.5 text-left items-start whitespace-normal h-auto py-4 text-sm font-normal border-primary/20"
            >
              <Undo2 className="h-4 w-4" />
              {t("examQuestionCard.undoSkip")}
            </Button>
          </div>
        ) : (
          renderQuestion()
        )}
        {/* Mobile Skip Button - shown only below sm breakpoint */}
        {!showAnswer && !isSkipped && (
          <div className="block sm:hidden mt-2 text-left">
            {" "}
            {/* Container to align button right */}
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className="space-x-2 text-muted-foreground underline px-0"
                    disabled={isSaveSpaceExamAnswerPending}
                    onClick={handleSkipQuestion}
                  >
                    <span>{t("examQuestionCard.skipQuestionMobile")}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="p-3">
                  <p>{t("examQuestionCard.skipTooltip")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
        {showAnswer && (
          <div
            className={cn("mt-4 p-4 rounded-lg", getBgColor(score, isSkipped))}
          >
            {renderQuestionStatus()}
          </div>
        )}
      </div>
    </div>
  );
};

ExamQuestionCard.displayName = "ExamQuestionCard";

export default ExamQuestionCard;
