import { useGetExamList } from "@/query-hooks/exam";
import { useParams } from "next/navigation";
import React from "react";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { useTranslation } from "react-i18next";

const ExamProgressButton = () => {
  const params = useParams();
  const { data: examList, isLoading: isExamListLoading } = useGetExamList(
    params.spaceId as string,
  );
  const lastExam = examList?.[examList?.length - 1];
  const { t } = useTranslation();

  if (examList?.length === 0) {
    return null;
  }

  if (isExamListLoading) {
    return <Skeleton className="w-full h-10" />;
  }

  return (
    <Link href={`/exam/${lastExam?._id}/space/${params.spaceId}/progress`}>
      <Button
        variant="outline"
        className="shadow-[0_4px_10px_rgba(0,0,0,0.02)] hover:dark:border-neutral-700/40 bg-white dark:bg-neutral-800/50 text-primary/80 hover:text-primary hover:bg-transparent"
      >
        <ClipboardList className="mr-2 h-4 w-4" />
        {t("viewResults")}
      </Button>
    </Link>
  );
};

export default ExamProgressButton;
