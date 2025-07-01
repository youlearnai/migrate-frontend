"use client";
import React, { useState, useEffect } from "react";
import { Progress } from "../ui/progress";
import { Button } from "../ui/button";
import ExamQuestionCard from "./exam-question-card";
import {
  useGetSpaceExam,
  useGetSpaceExamAnswers,
  useResetSpaceExam,
  useSubmitSpaceExam,
} from "@/query-hooks/exam";
import { useParams, useRouter } from "next/navigation";
import { ExamAnswer } from "@/lib/types";
import ExamHeader from "./exam-header";
import { ClipboardList, RotateCcw, Share } from "lucide-react";
import ExamBoardSkeleton from "../skeleton/exam-board-skeleton";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useModalStore } from "@/hooks/use-modal-store";

const ExamBoard = () => {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const { data: spaceExam, isLoading: isSpaceExamLoading } = useGetSpaceExam(
    params.examId as string,
  );
  const { data: spaceExamAnswers, isLoading: isSpaceExamAnswersLoading } =
    useGetSpaceExamAnswers(params.examId as string);
  const { mutate: submitSpaceExam, isPending: isSubmitSpaceExamPending } =
    useSubmitSpaceExam();
  const { mutate: resetSpaceExam, isPending: isResetSpaceExamPending } =
    useResetSpaceExam();
  const { onOpen, type } = useModalStore();

  const isSubmitted = spaceExam?.submitted_at !== null;
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const handleSubmitExam = () => {
    submitSpaceExam(
      {
        examId: params.examId as string,
      },
      {
        onSuccess: () => {
          window.scrollTo(0, 0);
        },
      },
    );
  };

  useEffect(() => {
    if (isSubmitted || !spaceExam?.user_exam?.exam_duration) return;

    const examDurationInMinutes = spaceExam.user_exam.exam_duration;
    const serverTimestamp = spaceExam.user_exam.created_at;
    const parsedTimestamp = serverTimestamp.endsWith("Z")
      ? serverTimestamp
      : `${serverTimestamp}Z`;

    const createdAtUTC = new Date(parsedTimestamp);
    const currentTimeMs = Date.now();
    const elapsedMs = currentTimeMs - createdAtUTC.getTime();

    if (elapsedMs < 0) {
      if (Math.abs(elapsedMs) > 12 * 60 * 60 * 1000) {
        return setTimeRemaining(examDurationInMinutes * 60 * 1000);
      }
    }

    const totalDurationMs = examDurationInMinutes * 60 * 1000;
    const adjustedElapsedMs = Math.max(0, elapsedMs);
    const remainingMs = Math.max(0, totalDurationMs - adjustedElapsedMs);
    setTimeRemaining(remainingMs);

    const updateTimer = () => {
      const currentMs = Date.now();
      const updatedElapsedMs = Math.max(0, currentMs - createdAtUTC.getTime());
      const remaining = Math.max(0, totalDurationMs - updatedElapsedMs);

      if (remaining <= 0) {
        setTimeRemaining(0);
        return;
      }

      setTimeRemaining(remaining);
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, [spaceExam, isSubmitted]);

  const handleResetExam = () => {
    resetSpaceExam(
      {
        examId: params.examId as string,
      },
      {
        onSuccess: () => {
          window.scrollTo(0, 0);
        },
      },
    );
  };

  const handleOpenShareExamModal = () => {
    onOpen("shareExamModal", {
      spaceId: spaceExam?.user_exam.space.id as string,
      examId: params.examId as string,
    });
  };

  const renderTimer = () => {
    if (timeRemaining === null) {
      return null;
    }

    if (timeRemaining <= 0) {
      return (
        <span className="text-sm font-medium text-red-500">
          {t("examBoard.timer.timesUp")}
        </span>
      );
    }

    const minutes = Math.floor(timeRemaining / (60 * 1000));
    const seconds = Math.floor((timeRemaining % (60 * 1000)) / 1000);

    return (
      <span className="text-sm font-medium flex-shrink-0 text-muted-foreground">
        {t("examBoard.timer.remaining", {
          minutes: minutes,
          seconds: seconds.toString().padStart(2, "0"),
        })}
      </span>
    );
  };

  const handleViewResults = () => {
    router.push(`/exam/${params.examId}/space/${params.spaceId}/progress`);
  };

  const examAnswersLength = spaceExamAnswers?.answers.filter(
    (answer) =>
      answer.is_skipped === true ||
      (answer.answer !== null && answer.answer !== ""),
  ).length;

  if (isSpaceExamLoading || !spaceExam || isSpaceExamAnswersLoading) {
    return <ExamBoardSkeleton />;
  }

  return (
    <div className="flex flex-col h-full">
      <div
        className={cn(
          "sticky top-0 z-10 bg-background w-full border-b",
          !isSubmitted && "py-4 sm:py-6",
        )}
      >
        <div className="flex items-center gap-4 justify-between w-full mx-auto px-4">
          <div className="w-2"></div>
          <Button
            variant="outline"
            onClick={handleOpenShareExamModal}
            className="size-icon xl:size-auto xl:px-4 gap-x-2"
          >
            <Share className="h-4 w-4" />
            <span className="hidden xl:inline">
              {t("shareExam.dialogTitle")}
            </span>
          </Button>

          <div className="flex w-full items-center gap-2 flex-grow justify-center">
            <span className="text-sm text-muted-foreground">
              {examAnswersLength}
            </span>
            <Progress
              className="bg-primary"
              parentClassName="h-3 w-full max-w-2xl"
              value={
                spaceExam?.questions.length > 0 &&
                examAnswersLength !== undefined
                  ? (examAnswersLength / spaceExam.questions.length) * 100
                  : 0
              }
            />
            <span className="text-sm text-muted-foreground">
              {spaceExam?.questions.length}
            </span>
          </div>

          {/* Right section with header and timer */}
          <div className="flex items-center flex-shrink-0 gap-2 w-24 justify-end">
            <ExamHeader />
            {!isSubmitted && renderTimer()}
          </div>
        </div>
      </div>
      <div className="flex-grow lg:w-3/5 2xl:w-1/2 w-full mx-auto overflow-y-auto mt-16 px-4 pb-24">
        {isSubmitted && (
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-medium">
              {t("examBoard.answerBreakdown")}
            </h2>
          </div>
        )}
        <div className="flex flex-col gap-10">
          {spaceExam?.questions.map((question) => (
            <ExamQuestionCard
              key={question.idx}
              question={question}
              showAnswer={isSubmitted}
              answer={
                spaceExamAnswers?.answers.find(
                  (answer) => answer.question.id === question._id,
                ) as ExamAnswer
              }
              content={question.content}
            />
          ))}
        </div>

        {!isSubmitted && (
          <div className="flex justify-center mt-10">
            <Button
              className="w-full py-6 text-sm"
              onClick={handleSubmitExam}
              disabled={isSubmitSpaceExamPending}
            >
              {isSubmitSpaceExamPending
                ? t("common2.submitting")
                : t("examBoard.submitExam")}
            </Button>
          </div>
        )}
      </div>

      {isSubmitted && (
        <div className="sticky bottom-0 z-10 bg-background py-4 w-full flex justify-center border-t">
          <div className="lg:w-3/5 2xl:w-1/2 w-full px-4">
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                disabled={isResetSpaceExamPending}
                onClick={handleResetExam}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                <span
                  key={
                    isResetSpaceExamPending
                      ? t("common2.retrying")
                      : t("examBoard.tryAgain")
                  }
                >
                  {isResetSpaceExamPending
                    ? t("common2.retrying")
                    : t("examBoard.tryAgain")}
                </span>
              </Button>
              <Button onClick={handleViewResults}>
                <ClipboardList className="mr-2 h-4 w-4" />
                <span key={t("examBoard.viewResults")}>
                  {t("examBoard.viewResults")}
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamBoard;
