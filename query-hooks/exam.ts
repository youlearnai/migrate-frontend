import {
  getExamList,
  getSpaceExam,
  getSpaceExamAnswers,
  getSpaceExamProgress,
  resetSpaceExam,
  saveSpaceExam,
  submitSpaceExam,
} from "@/endpoints/exam";
import useAuth from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useGetSpaceExam = (examId: string) => {
  const { user, loading } = useAuth();

  return useQuery({
    queryFn: async () => await getSpaceExam(user?.uid!, examId),
    queryKey: ["getSpaceExam", examId],
    enabled: !loading,
  });
};

export const useSaveSpaceExam = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      examId,
      questionId,
      answer,
      isSkipped = false,
    }: {
      examId: string;
      questionId: string;
      answer: string | null;
      isSkipped?: boolean;
    }) =>
      await saveSpaceExam(user?.uid!, examId, questionId, answer, isSkipped),
    mutationKey: ["saveSpaceExam"],
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["getSpaceExamAnswers", variables.examId],
      });
    },
  });
};

export const useSubmitSpaceExam = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ examId }: { examId: string }) =>
      await submitSpaceExam(user?.uid!, examId),
    mutationKey: ["submitSpaceExam"],
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["getSpaceExamProgress", variables.examId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["getSpaceExam", variables.examId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["getSpaceExamAnswers", variables.examId],
      });
    },
  });
};

export const useGetSpaceExamAnswers = (examId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryFn: async () => await getSpaceExamAnswers(user?.uid!, examId),
    queryKey: ["getSpaceExamAnswers", examId],
    enabled: !!user,
  });
};

export const useGetSpaceExamProgress = (examId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryFn: async () => await getSpaceExamProgress(user?.uid!, examId),
    queryKey: ["getSpaceExamProgress", examId],
    enabled: !!user,
  });
};

export const useResetSpaceExam = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ examId }: { examId: string }) =>
      await resetSpaceExam(user?.uid!, examId),
    mutationKey: ["resetSpaceExam"],
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["getSpaceExamProgress", variables.examId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["getSpaceExam", variables.examId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["getSpaceExamAnswers", variables.examId],
      });
    },
  });
};

export const useGetExamList = (spaceId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryFn: async () => await getExamList(user?.uid!, spaceId),
    queryKey: ["getExamList", spaceId],
    enabled: !!user,
  });
};
