import { Question } from "@/lib/types";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useTranslation } from "react-i18next";

const StudyGuideEditCard = ({ question }: { question: Question }) => {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">
          {t("studyGuide.quizNumber", {
            number: question.idx,
          })}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {question.question}
      </CardContent>
    </Card>
  );
};

export default StudyGuideEditCard;
