import React from "react";
import ExamBoard from "@/components/exam/exam-board";
import { getAuthData } from "@/app/actions/auth";
import { getSpaceExam, getSpaceExamAnswers } from "@/endpoints/exam";
import { dehydrate } from "@tanstack/react-query";
import { HydrationBoundary } from "@tanstack/react-query";
import ExamHeader from "@/components/exam/exam-header";

const ExamPage = async (props: { params: Promise<{ examId: string }> }) => {
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
        await queryClient.prefetchQuery({
          queryKey: ["getSpaceExamAnswers", params.examId],
          queryFn: () =>
            getSpaceExamAnswers(decodedToken.uid, params.examId, cookieHeader),
        }),
      ]);
    }
  } catch (error) {
    console.error("RSC Error: ", error);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ExamBoard />
    </HydrationBoundary>
  );
};

export default ExamPage;
