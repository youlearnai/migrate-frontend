import {
  addSpace,
  createSpaceExam,
  deleteSpace,
  getSpace,
  updateSpace,
  updateSpaceContent,
} from "@/endpoints/space";
import useAuth from "@/hooks/use-auth";
import { QuestionType, SpaceContent } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useGetSpace = (
  spaceId: string,
  options?: { enabled: boolean },
) => {
  const { user, loading } = useAuth();

  return useQuery({
    queryFn: async () =>
      await getSpace(user ? user?.uid : "anonymous", spaceId),
    queryKey: ["getSpace", user ? user?.uid : "anonymous", spaceId],
    enabled: !loading && !!spaceId && options?.enabled,
  });
};

export const useAddSpace = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      spaceName,
      visibility,
    }: {
      spaceName: string;
      visibility: string;
    }) => await addSpace(user?.uid!, spaceName, visibility),
    mutationKey: ["addSpace"],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSpaces", user?.uid] });
    },
  });
};

export const useDeleteSpace = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ spaceId }: { spaceId: string }) =>
      await deleteSpace(user?.uid!, spaceId),
    mutationKey: ["deleteSpace"],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSpaces"] });
    },
  });
};

export const useUpdateSpace = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      spaceId,
      spaceName,
      description,
      visibility,
    }: {
      spaceId: string;
      spaceName?: string;
      description?: string;
      visibility?: "private" | "public";
    }) =>
      await updateSpace(
        user?.uid!,
        spaceId,
        spaceName!,
        description!,
        visibility!,
      ),
    mutationKey: ["updateSpace"],
    onSuccess: (_data, varibales) => {
      queryClient.invalidateQueries({
        queryKey: [
          "getSpace",
          user ? user?.uid : "anonymous",
          varibales.spaceId,
        ],
      });
    },
  });
};

export const useUpdateSpaceContent = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      spaceId,
      spaceContents,
    }: {
      spaceId: string;
      spaceContents: SpaceContent[];
    }) => await updateSpaceContent(user?.uid!, spaceId, spaceContents),
    mutationKey: ["updateSpaceContent"],
    onSuccess: (_data, varibales) => {
      queryClient.invalidateQueries({
        queryKey: [
          "getSpace",
          user ? user?.uid : "anonymous",
          varibales.spaceId,
        ],
      });
    },
  });
};

export const useCreateSpaceExam = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      spaceId,
      contentIds,
      pastPaperUrls,
      questionTypes,
      numQuestions,
      examDate,
      examDuration,
    }: {
      spaceId: string;
      contentIds: string[];
      questionTypes: QuestionType[];
      pastPaperUrls?: string[];
      numQuestions?: number;
      examDate?: Date;
      examDuration?: number;
    }) =>
      await createSpaceExam(
        user?.uid!,
        spaceId,
        contentIds,
        questionTypes,
        pastPaperUrls,
        numQuestions,
        examDate,
        examDuration,
      ),
    mutationKey: ["createSpaceExam"],
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["getSpace", user?.uid!, variables.spaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["examGenerateLimit", user?.uid!],
      });
    },
  });
};
