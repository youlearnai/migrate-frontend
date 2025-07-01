import React from "react";
import { QuizDifficulty } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";

export type DifficultyChecklistProps = {
  difficulties: QuizDifficulty[];
  setDifficulties: (difficulties: QuizDifficulty[]) => void;
  className?: string;
};

const DifficultyChecklist: React.FC<DifficultyChecklistProps> = ({
  difficulties,
  setDifficulties,
  className,
}) => {
  const { t } = useTranslation();
  const diffArray = difficulties || [];

  const toggleDifficulty = (value: QuizDifficulty) => {
    if (diffArray.includes(value)) {
      setDifficulties(diffArray.filter((diff) => diff !== value));
    } else {
      setDifficulties([...diffArray, value]);
    }
  };

  const difficultyItems: {
    value: QuizDifficulty;
    label: string;
    logo: React.ReactNode;
  }[] = [
    {
      value: "easy",
      label: t("studyGuide.easy"),
      logo: <Star className="h-[14px] w-[14px]" />,
    },
    {
      value: "medium",
      label: t("studyGuide.medium"),
      logo: (
        <span className="flex items-center gap-[2px]">
          <Star className="h-[14px] w-[14px]" />
          <Star className="h-[14px] w-[14px]" />
        </span>
      ),
    },
    {
      value: "hard",
      label: t("studyGuide.hard"),
      logo: (
        <span className="flex items-center gap-[2px]">
          <Star className="h-[14px] w-[14px]" />
          <Star className="h-[14px] w-[14px]" />
          <Star className="h-[14px] w-[14px]" />
        </span>
      ),
    },
  ];

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {difficultyItems.map((item) => {
        const isSelected = diffArray.includes(item.value);

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
              toggleDifficulty(item.value);
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

export default DifficultyChecklist;
