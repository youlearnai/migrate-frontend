import React from "react";
import { QuestionType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CheckSquare, FileText, ToggleLeft, Type } from "lucide-react";
import { useTranslation } from "react-i18next";

export type QuestionTypeChecklistProps = {
  questionTypes: QuestionType[];
  setQuestionTypes: (questionTypes: QuestionType[]) => void;
  className?: string;
};

const QuestionTypeChecklist: React.FC<QuestionTypeChecklistProps> = ({
  questionTypes,
  setQuestionTypes,
  className,
}) => {
  const { t } = useTranslation();
  const qTypes = questionTypes || [];

  const toggleQuestionType = (value: QuestionType) => {
    if (qTypes.includes(value)) {
      setQuestionTypes(qTypes.filter((type) => type !== value));
    } else {
      setQuestionTypes([...qTypes, value]);
    }
  };

  const questionTypeItems: {
    value: QuestionType;
    label: string;
    logo: React.ReactNode;
  }[] = [
    {
      value: "multiple_choice",
      label: t("studyGuide.mcq"),
      logo: <CheckSquare className="h-[14px] w-[14px]" />,
    },
    {
      value: "free_response",
      label: t("studyGuide.frq"),
      logo: <FileText className="h-[14px] w-[14px]" />,
    },
    {
      value: "true_false",
      label: t("studyGuide.trueFalse"),
      logo: <ToggleLeft className="h-[14px] w-[14px]" />,
    },
    {
      value: "fill_in_blanks",
      label: t("studyGuide.fillInBlank"),
      logo: <Type className="h-[14px] w-[14px]" />,
    },
  ];

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {questionTypeItems.map((item) => {
        const isSelected = qTypes.includes(item.value);

        return (
          <button
            key={item.value}
            className={cn(
              "rounded-xl py-1.5 px-2 text-sm flex items-center transition-all duration-200 gap-1.5 border border-secondary/10",
              isSelected
                ? "bg-secondary text-secondary-foreground border-primary/10"
                : "bg-background text-muted-foreground hover:border-secondary/50 hover:text-foreground",
            )}
            onClick={(e) => {
              e.stopPropagation();
              toggleQuestionType(item.value);
            }}
          >
            {item.logo}
            {item.label}
          </button>
        );
      })}
    </div>
  );
};

export default QuestionTypeChecklist;
