import { GenUIMCQQuestion, GenUiQuizCardProps } from "@/lib/types";
import { cn } from "@/lib/utils";
import React from "react";
import { Textarea } from "../ui/textarea";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import Markdown from "../global/markdown";
import { Mic, X, Check, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const GenUiQuizCard = React.forwardRef<HTMLDivElement, GenUiQuizCardProps>(
  (props, ref) => {
    const { t } = useTranslation();
    const {
      question,
      answer,
      frqAnswer,
      setFrqAnswer,
      onSubmitAnswer,
      answerStatus,
      isAnswerSubmitting,
      recordingState,
      startRecording,
      stopAndTranscribe,
      cancelRecording,
    } = props;
    const isCorrect = answerStatus === "correct";
    const isIncorrect = answerStatus === "incorrect";
    const isDontKnow = answerStatus === "dontKnow";
    const isMarkedComplete = answerStatus === "markedComplete";
    const isUnattempted = answerStatus === "unattempted";

    const mcqStyles = (i: number, correctOptionIdx: number) => {
      const selectedOption = parseInt(answer?.answer as string);

      return cn(
        "rounded-2xl w-full justify-start border-1.5 border-primary/10 text-left items-start whitespace-normal h-auto py-4 text-sm font-normal hover:bg-transparent bg-neutral-100/20 dark:bg-neutral-800/20",
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
        isUnattempted && "hover:border-muted-foreground/60",
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

    const renderMCQQuestion = () => {
      const mcqQuestion = question as GenUIMCQQuestion;

      return (
        <div className="space-y-3 flex flex-col">
          {mcqQuestion.options.map((option: string, i: number) => {
            return (
              <Button
                key={i}
                variant="outline"
                className={mcqStyles(i, mcqQuestion.correct_option_idx)}
                onClick={() => {
                  onSubmitAnswer(i.toString());
                }}
                disabled={!isUnattempted}
              >
                <span className="mr-2">{String.fromCharCode(65 + i)}.</span>
                <Markdown className="text-left">{option}</Markdown>
              </Button>
            );
          })}
        </div>
      );
    };

    const renderDictateButton = () => {
      if (
        !recordingState ||
        !startRecording ||
        !stopAndTranscribe ||
        !cancelRecording
      ) {
        return null;
      }

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
              <canvas data-gen-ui-voice-canvas="true" className="w-full h-12" />
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
          <div className="absolute bottom-0 right-1">
            {renderDictateButton()}
          </div>
        </div>
      );
    };

    return (
      <div
        ref={ref}
        className={cn("w-full h-full overflow-y-auto rounded-lg")}
        role="region"
        aria-roledescription="carousel"
      >
        <div className="p-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-md font-normal leading-relaxed flex space-x-1.5">
              <span>{question.idx + 1}.</span>{" "}
              <Markdown>{question.question}</Markdown>
            </h2>
          </div>
          {renderQuestion()}
        </div>
      </div>
    );
  },
);

export default GenUiQuizCard;
