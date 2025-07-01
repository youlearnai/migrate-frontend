"use client";
import {
  useGetExamList,
  useGetSpaceExam,
  useGetSpaceExamProgress,
  useResetSpaceExam,
} from "@/query-hooks/exam";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import {
  Text,
  StickyNote,
  ChevronDown,
  Mic,
  Play,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle,
  AudioLines,
  Share,
  MessageSquareText,
  RotateCcw,
  Plus,
  Repeat,
  BookCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BoundingBoxData,
  ContentType,
  QuestionType,
  SpaceExamConcept,
  SpaceExamContent,
  UserExam,
} from "@/lib/types";
import { useLeftSidebar } from "@/hooks/use-left-sidebar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { convertStringToBbox, formatMilliseconds } from "@/lib/utils";
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import Logo from "@/components/global/logo";
import { useSourceStore } from "@/hooks/use-source-store";
import useSpaceExamStore from "@/hooks/use-space-exam-store";
import ExamProgressSkeleton from "../skeleton/exam-progress-skeleton";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { isAudioType, isVideoType } from "@/lib/utils";
import { useModalStore } from "@/hooks/use-modal-store";
import { useCreateSpaceExam } from "@/query-hooks/space";
import { toast } from "sonner";
import { CustomError } from "@/lib/custom-fetch";
import ExamProcess from "./exam-process";
import FullScreener from "../global/full-screener";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const CircularProgress = ({ value }: { value: number }) => {
  const radius = 45;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const { t } = useTranslation();

  const getProgressColor = (percentage: number): string => {
    if (percentage < 25) {
      return "text-red-500";
    } else if (percentage < 50) {
      return "text-orange-500";
    } else if (percentage < 75) {
      return "text-yellow-500";
    } else {
      return "text-green-500";
    }
  };

  const progressColorClass = getProgressColor(value);

  return (
    <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex flex-col items-center justify-center">
      <svg
        className="absolute top-0 left-0 w-full h-full"
        viewBox="0 0 100 100"
      >
        <circle
          className="text-primary/5 stroke-current dark:text-primary/10"
          strokeWidth={strokeWidth}
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
        ></circle>
        <circle
          className={`${progressColorClass} stroke-current`}
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
        ></circle>
      </svg>
      <span className="text-xl sm:text-2xl font-bold text-neutral-700 dark:text-primary z-10">
        {value.toFixed(1)}%
      </span>
      <span className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground z-10">
        {t("examProgress.score")}
      </span>
    </div>
  );
};

const getProgressBgColor = (percentage: number): string => {
  if (percentage < 25) {
    return "bg-red-500";
  } else if (percentage < 50) {
    return "bg-orange-500";
  } else if (percentage < 75) {
    return "bg-yellow-500";
  } else {
    return "bg-green-500";
  }
};

function calculateQuestionsFromPercentage(
  percentage: number,
  totalQuestionCount: number,
): number {
  return Math.round((percentage / 100) * totalQuestionCount);
}

function formatConceptSourceRange(
  contentType: string,
  startSource: string | number,
  endSource: string | number,
  t: TFunction,
): string {
  if (
    isVideoType(contentType as ContentType) ||
    isAudioType(contentType as ContentType)
  ) {
    return `${formatMilliseconds(Number(startSource))} - ${formatMilliseconds(Number(endSource))}`;
  } else {
    return t("examProgress.pageRange", {
      start: startSource,
      end: endSource,
    });
  }
}

function getProgressMessageKey(percentage: number): string {
  let keys: string[];

  if (percentage < 25) {
    keys = [
      "examProgress.messages.low1",
      "examProgress.messages.low2",
      "examProgress.messages.low3",
      "examProgress.messages.low4",
    ];
  } else if (percentage < 50) {
    keys = [
      "examProgress.messages.medium1",
      "examProgress.messages.medium2",
      "examProgress.messages.medium3",
      "examProgress.messages.medium4",
    ];
  } else if (percentage < 75) {
    keys = [
      "examProgress.messages.good1",
      "examProgress.messages.good2",
      "examProgress.messages.good3",
      "examProgress.messages.good4",
    ];
  } else if (percentage < 90) {
    keys = [
      "examProgress.messages.great1",
      "examProgress.messages.great2",
      "examProgress.messages.great3",
      "examProgress.messages.great4",
    ];
  } else {
    keys = [
      "examProgress.messages.excellent1",
      "examProgress.messages.excellent2",
      "examProgress.messages.excellent3",
      "examProgress.messages.excellent4",
    ];
  }
  const randomIndex = Math.floor(Math.random() * keys.length);
  return keys[randomIndex];
}

function calculateContentProgress(content: SpaceExamContent): number {
  const totalQuestions = content.concepts.reduce(
    (sum, concept) => sum + concept.question_count,
    0,
  );
  const correctQuestions = content.concepts.reduce(
    (sum, concept) =>
      sum +
      calculateQuestionsFromPercentage(
        concept.progress,
        concept.question_count,
      ),
    0,
  );
  return totalQuestions > 0 ? (correctQuestions / totalQuestions) * 100 : 0;
}

const ExamProgress = () => {
  const router = useRouter();
  const params = useParams();
  const { t, i18n } = useTranslation();
  const { data: spaceExamProgressData, isLoading: isSpaceExamProgressLoading } =
    useGetSpaceExamProgress(params?.examId as string);
  const { data: spaceExam, isLoading: isSpaceExamLoading } = useGetSpaceExam(
    params?.examId as string,
  );
  const { data: examList, isLoading: isExamListLoading } = useGetExamList(
    spaceExam?.user_exam.space.id as string,
  );
  const { mutate: resetExam, isPending: isResetExamLoading } =
    useResetSpaceExam();
  const { isOpen: isLeftSidebarOpen, setIsOpen: setIsLeftSidebarOpen } =
    useLeftSidebar();
  const { isOpen: isRightSidebarOpen, setIsOpen: setIsRightSidebarOpen } =
    useRightSidebar();
  const { onSource } = useSourceStore();
  const { setIsSpaceExamOpen, setData: setSpaceExamData } = useSpaceExamStore();
  const { onOpen } = useModalStore();
  const [shareExamClicked, setShareExamClicked] = useState<boolean>(
    localStorage.getItem("shareExamClicked") === "true",
  );
  const { mutate: createSpaceExam, isPending: isCreatingSpaceExam } =
    useCreateSpaceExam();

  const examProgressSummary = spaceExamProgressData;

  const getCurrentExamIndex = () => {
    if (!examList || !spaceExam) return -1;
    return examList.findIndex((exam) => exam._id === spaceExam.user_exam._id);
  };

  function renderReviewStatus(
    progress: number,
    source: number,
    contentId: string,
    bboxValue?: string,
    isSkipped?: boolean,
  ): React.ReactNode {
    if (isSkipped) {
      return (
        <Button className="flex hover:text-primary/80 cursor-default items-center gap-2 text-neutral-500 dark:text-neutral-400 rounded-md px-2 py-1 h-6 text-xs bg-neutral-500/10 dark:bg-neutral-500/30 hover:bg-neutral-500/20 hover:text-neutral-600 font-normal">
          <span>{t("examProgress.skipped")}</span>
        </Button>
      );
    }
    if (progress >= 75) {
      return (
        <Button className="flex hover:text-primary/80 cursor-default items-center gap-2 text-green-500 rounded-md px-2 py-1 h-6 text-xs bg-green-500/10 hover:bg-green-500/20 hover:text-green-600 font-normal">
          <span>{t("examProgress.status.complete")}</span>
        </Button>
      );
    }

    const bbox = bboxValue
      ? convertStringToBbox(bboxValue as string)
      : undefined;

    const handleSourceClick = () => {
      onSource(source, bbox, {
        type: "examProgress",
        origin: params.examId as string,
      });
      router.push(`/learn/space/${params.spaceId}/content/${contentId}`);
    };

    return (
      <Button
        className="flex hover:text-primary/80 items-center border border-yellow-500/20 gap-1 text-yellow-500 dark:text-yellow-400 rounded-md px-2 py-1 h-6 text-xs bg-yellow-500/10 dark:bg-yellow-500/30 hover:bg-yellow-500/20 hover:text-yellow-600 font-normal"
        onClick={handleSourceClick}
      >
        {t("examProgress.status.review")}
        <ChevronRight size={12} />
      </Button>
    );
  }

  const isFirstExam = () => getCurrentExamIndex() <= 0;
  const isLastExam = () => {
    const currentIndex = getCurrentExamIndex();
    return currentIndex === -1 || currentIndex >= (examList?.length || 0) - 1;
  };

  const handlePreviousExam = () => {
    if (!examList || isFirstExam()) return;

    const currentIndex = getCurrentExamIndex();
    const previousExam = examList[currentIndex - 1];
    router.push(`/exam/${previousExam._id}/space/${params.spaceId}/progress`);
  };

  const handleNextExam = () => {
    if (!examList || isLastExam()) return;

    const currentIndex = getCurrentExamIndex();
    const nextExam = examList[currentIndex + 1];
    router.push(`/exam/${nextExam._id}/space/${params.spaceId}/progress`);
  };

  useEffect(() => {
    if (isLeftSidebarOpen) {
      setIsLeftSidebarOpen?.(false);
    }
    if (isRightSidebarOpen) {
      setIsRightSidebarOpen?.(false);
    }
  }, [
    isLeftSidebarOpen,
    setIsLeftSidebarOpen,
    isRightSidebarOpen,
    setIsRightSidebarOpen,
  ]);

  if (isSpaceExamProgressLoading || isSpaceExamLoading || isExamListLoading) {
    return <ExamProgressSkeleton />;
  }

  const defaultValues =
    examProgressSummary?.contents?.map(
      (content: SpaceExamContent) => content.content._id,
    ) || [];

  const totalTime = (() => {
    if (!spaceExam?.submitted_at) {
      return "--";
    }

    try {
      const serverCreatedTimestamp = spaceExam.user_exam.created_at;
      const serverSubmittedTimestamp = spaceExam.submitted_at;

      const parsedCreatedTimestamp = serverCreatedTimestamp.endsWith("Z")
        ? serverCreatedTimestamp
        : `${serverCreatedTimestamp}Z`;

      const parsedSubmittedTimestamp = serverSubmittedTimestamp.endsWith("Z")
        ? serverSubmittedTimestamp
        : `${serverSubmittedTimestamp}Z`;

      const createdAtUTC = new Date(parsedCreatedTimestamp);
      const submittedAtUTC = new Date(parsedSubmittedTimestamp);

      if (isNaN(createdAtUTC.getTime()) || isNaN(submittedAtUTC.getTime())) {
        return "--";
      }

      const timeDiffMs = Math.max(
        0,
        submittedAtUTC.getTime() - createdAtUTC.getTime(),
      );

      const hours = Math.floor(timeDiffMs / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiffMs % (1000 * 60)) / 1000);

      const formattedMinutes = minutes.toString().padStart(2, "0");
      const formattedSeconds = seconds.toString().padStart(2, "0");

      if (hours > 0) {
        return `${hours}:${formattedMinutes}:${formattedSeconds}`;
      } else {
        return `${minutes}:${formattedSeconds}`;
      }
    } catch (error) {
      console.error("Error calculating exam time:", error);
      return "--";
    }
  })();

  const previewLink = `/exam/${params?.examId}/space/${params.spaceId}`;

  const renderContentType = (content: SpaceExamContent) => {
    if (isVideoType(content.content.type as ContentType)) {
      return (
        <Play
          size={16}
          className="text-neutral-800 dark:text-neutral-200 block group-hover:hidden flex-shrink-0"
        />
      );
    } else if (content.content.type === "stt") {
      return (
        <Mic
          size={16}
          className="text-neutral-800 dark:text-neutral-200 block group-hover:hidden flex-shrink-0"
        />
      );
    } else if (content.content.type === "audio") {
      return (
        <AudioLines
          size={16}
          className="text-neutral-800 dark:text-neutral-200 block group-hover:hidden flex-shrink-0"
        />
      );
    } else if (content.content.type === "conversation") {
      return (
        <MessageSquareText
          size={16}
          className="text-neutral-800 dark:text-neutral-200 block group-hover:hidden flex-shrink-0"
        />
      );
    } else {
      return (
        <Text
          size={16}
          className="text-neutral-800 dark:text-neutral-200 block group-hover:hidden flex-shrink-0"
        />
      );
    }
  };

  const handleResetExam = () => {
    resetExam(
      {
        examId: params?.examId as string,
      },
      {
        onSuccess: () => {
          router.push(`/exam/${params?.examId}/space/${params.spaceId}`);
        },
      },
    );
  };

  const handleNewExam = () => {
    setIsSpaceExamOpen(true);
    setSpaceExamData({ space_id: spaceExam?.user_exam.space.id as string });
    router.push(`/space/${spaceExam?.user_exam.space.id}`);
  };

  const handleRetryExamWithSameConfig = () => {
    if (!spaceExam || !params.spaceId) return;

    const user_exam: UserExam = spaceExam.user_exam;
    const spaceId = user_exam.space.id as string;

    const contentIds =
      user_exam.contents?.map((content) => content.id! || content._id!) || [];
    const defaultQuestionTypes: QuestionType[] = [
      "multiple_choice",
      "free_response",
    ];
    const questionTypes = user_exam.question_types;
    const numQuestions = user_exam.total_questions;
    const examDuration = user_exam.exam_duration;
    const pastPaperUrls = user_exam.past_paper_url
      ? [user_exam.past_paper_url]
      : undefined;

    if (contentIds.length === 0) {
      toast.error(t("toast.selectContents"));
      return;
    }

    createSpaceExam(
      {
        spaceId,
        contentIds,
        pastPaperUrls,
        questionTypes,
        numQuestions,
        examDuration,
      },
      {
        onSuccess: (data) => {
          router.push(`/exam/${data._id}/space/${spaceId}`);
        },
        onError: (error) => {
          if (error instanceof CustomError && error.status === 402) {
            toast.error(t("toastExam.upgradeRequired"));
          }
        },
      },
    );
  };

  const handleCloseExamProgress = () => {
    if (spaceExam?.user_exam.space.id) {
      router.push(`/space/${spaceExam.user_exam.space.id}`);
    }
  };

  const handleOpenShareExamModal = () => {
    localStorage.setItem("shareExamClicked", "true");
    setShareExamClicked(true);
    onOpen("shareExamModal", {
      spaceId: spaceExam?.user_exam.space.id as string,
      examId: params.examId as string,
    });
  };

  const progressMessageKey = getProgressMessageKey(
    examProgressSummary?.overall_progress as number,
  );
  const progressMessage = t(progressMessageKey);

  const currentLocale = i18n.language;

  if (isCreatingSpaceExam) {
    return (
      <FullScreener key={isCreatingSpaceExam.toString()}>
        <ExamProcess key={isCreatingSpaceExam.toString()} autoProgress={true} />
      </FullScreener>
    );
  }

  return (
    <div className="sm:p-6 max-w-4xl mx-auto font-sans">
      <div className="hidden sm:block fixed top-4 left-4 z-50">
        <Logo size="sm" />
      </div>
      <div className="block sm:hidden fixed top-4 left-4 z-50">
        <Logo size="lg" />
      </div>

      {examList && (
        <div className="flex items-center mb-8 justify-center gap-x-4">
          {examList.length > 1 && (
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousExam}
              disabled={isFirstExam()}
              className={`${isFirstExam() ? "opacity-50 cursor-not-allowed" : ""} border-none`}
            >
              <ChevronLeft
                size={16}
                className={`${isFirstExam() ? "text-neutral-400 dark:text-neutral-500" : "text-primary/80"} block group-hover:hidden flex-shrink-0`}
              />
            </Button>
          )}
          <div className="flex flex-col items-center text-center">
            <div className="text-base font-medium text-neutral-600 dark:text-neutral-300">
              {t("examProgress.examTitle", {
                number: getCurrentExamIndex() + 1,
              })}
            </div>
          </div>
          {examList.length > 1 && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextExam}
              disabled={isLastExam()}
              className={`${isLastExam() ? "opacity-50 cursor-not-allowed" : ""} border-none`}
            >
              <ChevronRight
                size={16}
                className={`${isLastExam() ? "text-neutral-400 dark:text-neutral-500" : "text-primary/80"} block group-hover:hidden flex-shrink-0`}
              />
            </Button>
          )}
        </div>
      )}
      <div className="fixed top-4 flex gap-2 right-4 z-50">
        <Button
          variant="outline"
          onClick={handleOpenShareExamModal}
          className="size-icon xl:size-auto xl:px-4 gap-x-2 relative"
        >
          <Share className="h-4 w-4" />
          <span className="hidden xl:inline">{t("shareExam.dialogTitle")}</span>
          {!shareExamClicked && (
            <span className="absolute top-1 right-1">
              <span className="animate-pulse relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
            </span>
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCloseExamProgress}
          className=" rounded-full"
          aria-label={t("examProgress.closeAriaLabel")}
        >
          <X size={20} className="sm:w-6 sm:h-6 text-primary/80" />
        </Button>
      </div>

      <div className="text-center mb-8 ml-5">
        <h2 className="text-xl sm:text-2xl font-medium text-primary/80 dark:text-primary my-10 sm:my-12">
          {progressMessage}
        </h2>
        <div className="flex justify-center items-center gap-x-12 sm:gap-x-24 mb-8">
          <div className="text-center">
            <div className="text-xl font-medium sm:text-2xl">
              {examProgressSummary?.num_skipped}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground/80 dark:text-muted-foreground/80">
              {t("examProgress.skipped")}
            </div>
          </div>
          <CircularProgress
            value={examProgressSummary?.overall_progress as number}
          />
          <div className="text-center">
            <div className="text-xl font-medium sm:text-2xl">{totalTime}</div>
            <div className="text-xs sm:text-sm text-muted-foreground/80 dark:text-muted-foreground/80">
              {t("examProgress.timeTaken")}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center mb-8">
        <Button
          variant="link"
          className="underline text-primary/60 hover:text-primary dark:text-primary/60 dark:hover:text-primary text-sm font-semibold justify-center"
          onClick={() => router.push(previewLink)}
        >
          {t("examProgress.previewExam", {
            number: getCurrentExamIndex() + 1,
          })}
        </Button>
      </div>

      <div className="flex flex-col gap-6 mb-10 border rounded-2xl p-6 pb-2 dark:bg-neutral-950/20">
        <Accordion
          type="multiple"
          defaultValue={defaultValues as string[]}
          className="flex flex-col gap-6"
        >
          {examProgressSummary?.contents?.map((content: SpaceExamContent) => {
            const contentCorrectTotal = `${content.concepts.reduce((sum, concept) => sum + calculateQuestionsFromPercentage(concept.progress, concept.question_count), 0)}/${content.concepts.reduce((sum, concept) => sum + concept.question_count, 0)}`;
            const contentProgress = calculateContentProgress(content);
            const progressBgClass = getProgressBgColor(contentProgress);

            return (
              <AccordionItem
                key={content.content._id}
                value={content.content._id as string}
                className="border-b last:border-b-0 last:mb-0"
              >
                <AccordionTrigger
                  showChevron={false}
                  className="flex items-center justify-between mb-4 cursor-pointer group p-0 "
                >
                  <h3 className="text-base font-medium flex items-center gap-2">
                    {renderContentType(content)}
                    <ChevronDown
                      size={16}
                      className="text-neutral-400 dark:text-neutral-500 hidden group-hover:block transition-transform duration-200 group-data-[state=open]:rotate-180 flex-shrink-0"
                    />
                    <span className="text-sm sm:text-base truncate max-w-[130px] sm:max-w-[250px] md:max-w-[300px] lg:max-w-[400px]">
                      {content.content.title}
                    </span>
                  </h3>
                  <div className="flex items-center gap-4">
                    <Progress
                      value={contentProgress}
                      className={`w-16 sm:w-24 md:w-32 ${progressBgClass}`}
                      parentClassName="h-3.5"
                    />
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      {contentCorrectTotal}
                    </span>
                  </div>
                </AccordionTrigger>

                <AccordionContent
                  animate={false}
                  className="sm:pl-3 animate-in fade-in duration-300 flex flex-col gap-4 space-y-1"
                >
                  {content.concepts?.map((concept: SpaceExamConcept) => {
                    const conceptPageRange = formatConceptSourceRange(
                      content.content.type,
                      concept.start_source,
                      concept.end_source,
                      t,
                    );
                    const conceptCorrectTotal = `${calculateQuestionsFromPercentage(concept.progress, concept.question_count)}/${concept.question_count}`;

                    return (
                      <div
                        key={concept.concept_id}
                        className="flex justify-between items-center text-sm"
                      >
                        <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                          <span className="text-xs sm:text-sm truncate max-w-[160px] sm:max-w-[260px] md:max-w-[280px] lg:max-w-[500px]">
                            {concept.concept_name}
                          </span>
                          <span className="md:block hidden text-xs sm:text-sm text-primary">
                            •
                          </span>
                          <span className="md:block hidden text-xs sm:text-sm text-muted-foreground/80">
                            {conceptPageRange}
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm flex items-center gap-4 text-neutral-500 dark:text-neutral-400">
                          {renderReviewStatus(
                            concept.progress,
                            concept.start_source,
                            content.content._id as string,
                            concept.end_bbox,
                            conceptCorrectTotal === "0/0",
                          )}
                          {conceptCorrectTotal !== "0/0" && (
                            <span className="font-medium text-neutral-600 dark:text-neutral-400">
                              {conceptCorrectTotal}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      <TooltipProvider>
        <div className="flex justify-center gap-4 mb-8">
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                disabled={isResetExamLoading}
                onClick={handleResetExam}
                className="flex items-center gap-2"
              >
                <RotateCcw size={16} />
                {isResetExamLoading
                  ? t("common2.retrying")
                  : t("examProgress.tryAgain")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("examProgress.tryAgainTooltip")}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleRetryExamWithSameConfig}
                disabled={isCreatingSpaceExam}
                className="flex items-center gap-2"
              >
                <Repeat size={16} />
                {isCreatingSpaceExam
                  ? t("common2.creating")
                  : t("examProgress.retrySameExam")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("examProgress.retrySameExamTooltip")}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                onClick={handleNewExam}
                className="flex items-center gap-2"
              >
                <BookCheck className="w-4 h-4" />
                {t("createExam")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("examProgress.newExamTooltip")}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
};

export default ExamProgress;
