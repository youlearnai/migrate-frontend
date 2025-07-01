import { getAuthData } from "@/app/actions/auth";
import ExamProgress from "@/components/exam/exam-progress";
import {
  getExamList,
  getSpaceExam,
  getSpaceExamProgress,
} from "@/endpoints/exam";
import { dehydrate } from "@tanstack/react-query";
import { HydrationBoundary } from "@tanstack/react-query";
import React from "react";

const SpaceExamProgress = async (props: {
  params: Promise<{ examId: string }>;
}) => {
  const params = await props.params;
  const { queryClient, cookieHeader, decodedToken } = await getAuthData();

  try {
    if (decodedToken?.uid) {
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: ["getSpaceExam", params.examId],
          queryFn: () =>
            getSpaceExam(decodedToken.uid, params.examId, cookieHeader),
        }),
        queryClient.prefetchQuery({
          queryKey: ["getSpaceExamProgress", params.examId],
          queryFn: () =>
            getSpaceExamProgress(decodedToken.uid, params.examId, cookieHeader),
        }),
        queryClient.prefetchQuery({
          queryKey: ["getExamList", params.examId],
          queryFn: () =>
            getExamList(decodedToken.uid, params.examId, cookieHeader),
        }),
      ]);
    }
  } catch (error) {
    console.error("RSC Error: ", error);
  }

  return (
    <div className="sm:px-10 lg:px-24 xl:px-36 mt-4 w-full">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ExamProgress />
      </HydrationBoundary>
    </div>
  );
};

export default SpaceExamProgress;
