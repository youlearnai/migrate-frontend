import React from "react";
import { cn } from "@/lib/utils";
import { FillInBlankQuestionProps, Segment } from "@/lib/types";

const parseQuestionSegments = (questionText: string): Segment[] => {
  const parts = questionText.split("___");
  const segments: Segment[] = [];

  parts.forEach((part, index) => {
    if (index > 0) {
      segments.push({ type: "blank", content: "", index: index - 1 });
    }
    if (part) {
      segments.push({ type: "text", content: part });
    }
  });

  return segments;
};

const FillInBlankQuestion: React.FC<FillInBlankQuestionProps> = ({
  question,
  answer,
  onAnswerChange,
  answerStatus,
  isDisabled = false,
}) => {
  const segments = parseQuestionSegments(question.question);

  const getAnswerValues = (): string[] => {
    const blanksCount = segments.filter((s) => s.type === "blank").length;
    const parsedAnswers = answer ? answer.split("|||") : [];
    return new Array(blanksCount)
      .fill("")
      .map((_, i) => parsedAnswers[i] || "");
  };

  const handleAnswerChange = (index: number, value: string) => {
    const currentAnswers = getAnswerValues();
    currentAnswers[index] = value;
    const joinedAnswer = currentAnswers.join("|||");
    onAnswerChange(joinedAnswer);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Escape") {
      e.preventDefault();
      handleAnswerChange(index, "");
    }
  };

  const getInputClassName = () => {
    return cn(
      "inline-block w-[80px] max-w-[80px] px-1 py-0 mx-1",
      "border-0 border-b-2 bg-transparent",
      "text-sm font-normal leading-relaxed",
      "focus:outline-none",
      answerStatus === "unattempted" && "border-muted-foreground/30",
      answerStatus === "correct" &&
        "border-green-500 bg-green-500/10 dark:bg-green-500/20",
      answerStatus === "incorrect" &&
        "border-red-500 bg-red-500/10 dark:bg-red-500/20",
      answerStatus === "dontKnow" &&
        "border-yellow-500 bg-yellow-500/10 dark:bg-yellow-500/20",
      answerStatus === "markedComplete" && "border-green-500 bg-green-500/10",
      isDisabled && "cursor-not-allowed opacity-60",
    );
  };

  const getInputStyle = (value: string) => {
    const minWidth = 80;
    const maxWidth = 200;
    const charWidth = 8;
    const padding = 16;
    const width = Math.min(
      Math.max((value.length || 4) * charWidth + padding, minWidth),
      maxWidth,
    );
    return { width: `${width}px` };
  };

  const renderInput = (blankIndex: number) => {
    const answerValues = getAnswerValues();
    const value = answerValues[blankIndex] || "";

    return (
      <input
        key={`blank-${blankIndex}`}
        type="text"
        value={value}
        onChange={(e) => handleAnswerChange(blankIndex, e.target.value)}
        onKeyDown={(e) => handleKeyDown(e, blankIndex)}
        className={getInputClassName()}
        style={getInputStyle(value)}
        disabled={isDisabled || answerStatus !== "unattempted"}
        aria-label={`Blank ${blankIndex + 1}`}
        autoComplete="off"
        autoFocus
      />
    );
  };

  return (
    <div className="leading-relaxed text-sm">
      {segments.map((segment, index) => {
        if (segment.type === "text") {
          return <span key={`text-${index}`}>{segment.content}</span>;
        } else {
          return renderInput(segment.index!);
        }
      })}
    </div>
  );
};

export default FillInBlankQuestion;
