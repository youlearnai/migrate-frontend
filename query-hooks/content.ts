import {
  addContent,
  addSTT,
  checkContentInSpace,
  deleteContent,
  deleteFlashcards,
  deleteStudyGuideAnswer,
  deleteStudyGuideQuestion,
  endSTT,
  fetchStudyGuideAnswers,
  fetchStudyGuideConceptProgress,
  fetchStudyGuideQuestionsByContent,
  fetchStudyGuideQuestionsByIds,
  fetchYouTubePlaylist,
  generateMoreFlashcards,
  getAllFlashcardsActiveRecall,
  getContent,
  getFlashcardActiveProgress,
  getFlashcardActiveReviewLogs,
  getFlashcards,
  getFlashcardsActiveRecall,
  getKeyConcepts,
  getNotes,
  getSummaryRanges,
  getTranscripts,
  gradeFlashcardsActiveRecall,
  regenerateStudyGuideQuestions,
  reviewFlashcards,
  startContentConversation,
  startSTT,
  submitStudyGuideAnswer,
  updateContent,
  updateFlashcards,
  updateNotes,
} from "@/endpoints/content";
import useAuth from "@/hooks/use-auth";
import { generateTTS, TTSSession } from "@/lib/tts";
import { useErrorStore } from "@/hooks/use-error-store";
import {
  useContentStatus,
  contentStatusManager,
} from "@/hooks/use-content-status";
import {
  Content,
  Flashcard,
  FlashcardModifiers,
  SpaceDetails,
  QuestionType,
  UpdateFlashcard,
  QuizDifficulty,
  ContentType,
  History,
  VideoUrl,
} from "@/lib/types";
import { DefaultBlockSchema, PartialBlock } from "@blocknote/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { isDocumentType, shuffleWithSeed } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";

export function useAddContent() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { openModal } = useErrorStore();
  const router = useRouter();
  const currentPath = usePathname();

  return useMutation({
    mutationFn: async ({
      spaceId,
      contentURLs,
      addToHistory,
      title,
      showToast = true,
      sync = false, // pubsub enabled by default
    }: {
      spaceId: string | undefined;
      contentURLs: string[];
      addToHistory: boolean;
      title?: string;
      showToast?: boolean;
      sync?: boolean;
    }) => {
      const generator = addContent(
        user ? user.uid : "anonymous",
        spaceId,
        contentURLs,
        user ? addToHistory : false,
        title,
        sync,
      );
      const contents: Content[] = [];

      const isDocumentExcludingPDF = (type: ContentType) => {
        const isDocument = isDocumentType(type);
        return isDocument && type !== "pdf";
      };

      for await (const chunk of generator) {
        try {
          const content: Content = JSON.parse(chunk);

          if (chunk.includes('"status"') && chunk.includes('"statusText"')) {
            try {
              const parsedChunk = JSON.parse(chunk);
              const status = parsedChunk.status;
              const statusText = parsedChunk.statusText;
              const service = parsedChunk.service;
              if (status === 402) {
                toast.error(t(statusText));
              }
              openModal(
                {
                  status,
                  statusText,
                  title: statusText,
                  service,
                },
                { source: `add-content` },
              );
            } catch (error) {}
            continue;
          }

          contents.push(content);

          await queryClient.setQueryData(
            ["getHistory", user?.uid ?? "anonymous", 1],
            (oldData: {
              content_history: History[];
              content_history_page_count: number;
            }) => {
              if (!oldData) return oldData;
              return {
                ...oldData,
                content_history: [
                  {
                    content: content,
                  },
                  ...oldData.content_history,
                ],
              };
            },
          );

          if (showToast) {
            toast.loading(content.title, {
              id: `content-status-${content.content_id}`,
            });
          }

          // subscribe to pubsub if not sync
          if (!sync && user?.uid && content.content_id) {
            const channel = `content_status:${user.uid}:${content.content_id}`;
            contentStatusManager.subscribe(channel, async (event) => {
              switch (event.status) {
                case "extraction_complete": {
                  if (showToast) {
                    toast.loading(t(event.content.title), {
                      description: t("processing") + "...",
                      duration: Infinity,
                      id: `content-status-${content.content_id}`,
                    });
                  }
                  await queryClient.setQueryData(
                    ["getSpace", user?.uid ?? "anonymous", spaceId],
                    (oldData: SpaceDetails) =>
                      oldData
                        ? {
                            ...oldData,
                            contents: [
                              event.content,
                              ...(oldData.contents || []).filter(
                                (c) =>
                                  c.content_id !== event.content.content_id,
                              ),
                            ],
                          }
                        : oldData,
                  );
                  await queryClient.invalidateQueries({
                    queryKey: ["getHistory", user?.uid ?? "anonymous", 1],
                  });
                  await queryClient.setQueryData(
                    ["getContent", event.content.content_id, spaceId],
                    (oldData: Content) => {
                      // If the content is a document excluding PDF, update the title and content_title and content_url
                      if (isDocumentExcludingPDF(oldData?.type)) {
                        return {
                          ...oldData,
                          title: event.content.title,
                          content_title: event.content.content_title,
                          content_url: event.content.content_url,
                        };
                      }
                      // This is to avoid the issue where the @pdf-viewer re-renders when content_url changes
                      return {
                        ...oldData,
                        title: event.content.title,
                        content_title: event.content.content_title,
                      };
                    },
                  );
                  break;
                }
                case "key_concepts_created": {
                  break;
                }
                case "failed": {
                  toast.error(event.message, {
                    id: `content-status-${content.content_id}`,
                  });
                  router.push(currentPath);
                  openModal(
                    {
                      status: event.status_code,
                      statusText: event.message,
                      title: event.message,
                      service: event.service,
                    },
                    { source: `add-content` },
                    event.status_code === 422,
                  );
                  await queryClient.setQueryData(
                    ["getSpace", user?.uid ?? "anonymous", spaceId],
                    (oldData: SpaceDetails) => {
                      if (!oldData) return oldData;
                      return {
                        ...oldData,
                        contents: oldData.contents?.filter(
                          (c) => c.content_id !== content.content_id,
                        ),
                      };
                    },
                  );
                  await queryClient.setQueryData(
                    ["getHistory", user?.uid ?? "anonymous", 1],
                    (oldData: {
                      content_history: History[];
                      content_history_page_count: number;
                    }) => {
                      if (!oldData) return oldData;
                      return {
                        ...oldData,
                        content_history: oldData.content_history.filter(
                          (c) => c.content.content_id !== content.content_id,
                        ),
                      };
                    },
                  );
                  break;
                }
                case "completed": {
                  if (showToast) {
                    toast.success(event.content.title, {
                      id: `content-status-${content.content_id}`,
                      description: event.message,
                      duration: 1500,
                    });
                  }
                  queryClient.invalidateQueries({
                    queryKey: ["addContentLimit", user?.uid ?? "anonymous"],
                  });
                }
              }
            });
          }

          queryClient.setQueryData(
            ["getSpace", user ? user?.uid : "anonymous", spaceId],
            (oldData: SpaceDetails) => {
              if (!oldData) return oldData;
              return {
                ...oldData,
                contents: [
                  content,
                  ...(oldData.contents || []).filter(
                    (c) => c.content_id !== content.content_id,
                  ),
                ],
              };
            },
          );
          await queryClient.invalidateQueries({
            queryKey: ["getUserIsNew", user ? user?.uid : "anonymous"],
          });

          // If sync, we want to invalidate the history query since its not done in by the pubsub
          // If sync, we want to invalidate the addContentLimit query
          if (sync) {
            await queryClient.invalidateQueries({
              queryKey: ["getHistory", user?.uid ?? "anonymous", 1],
            });
            queryClient.invalidateQueries({
              queryKey: ["addContentLimit", user?.uid ?? "anonymous"],
            });
          }
        } catch (error) {
          console.error("Error parsing chunk:", error);
        }
      }

      return contents;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["checkContent"],
      });
    },
    onError: (error) => {
      console.error("Error adding content:", error);
    },
  });
}

export function useDeleteContent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      spaceId,
      contentIds,
      deleteFromHistory,
    }: {
      spaceId: string;
      contentIds: string[];
      deleteFromHistory: boolean;
    }) =>
      await deleteContent(user?.uid!, spaceId, contentIds, deleteFromHistory),
    mutationKey: ["deleteContent"],
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "getSpace",
          user ? user?.uid : "anonymous",
          variables.spaceId,
        ],
      });
    },
  });
}

const loggedGetContentExtractionEvents = new Set<string>();

export const useGetContent = (
  spaceId: string | undefined,
  contentId: string,
  p0?: { enabled: boolean },
  addToHistory: boolean = true,
) => {
  const { user, loading } = useAuth();

  return useQuery({
    queryFn: async () =>
      await getContent(
        user ? user?.uid! : "anonymous",
        contentId,
        spaceId,
        addToHistory,
      ),
    queryKey: ["getContent", contentId, spaceId],
    enabled: !loading && p0?.enabled,
  });
};

export const useCheckContentInSpace = (
  contentId: string,
  p0?: { enabled: boolean },
) => {
  const { user } = useAuth();

  return useQuery({
    queryFn: async () => await checkContentInSpace(user?.uid!, contentId),
    queryKey: ["checkContent", contentId],
    enabled: !!user && p0?.enabled,
  });
};

export const useFlashcardsRaw = (contentId: string) => {
  const { user, loading } = useAuth();

  return useQuery({
    queryKey: flashcardsRawKey(user?.uid ?? "anonymous", contentId),
    queryFn: async () =>
      await getFlashcards(user?.uid ?? "anonymous", contentId),
    enabled: !loading,
    refetchOnWindowFocus: false,
  });
};

export const useGetFlashcards = (
  contentId: string,
  modifiers?: FlashcardModifiers,
) => {
  const { data: raw, ...rest } = useFlashcardsRaw(contentId);

  const seed = useMemo(() => Math.random(), [modifiers?.isShuffled]);

  const projected = useMemo(() => {
    if (!raw) return [];

    let list = raw;
    if (modifiers?.showOnlyStarred) {
      list = list.filter((c) => c.is_starred);
    }
    if (
      modifiers?.selectedKeyConcepts &&
      modifiers.selectedKeyConcepts.length > 0
    ) {
      list = list.filter(
        (c) =>
          c.key_concept &&
          modifiers.selectedKeyConcepts?.includes(
            c.key_concept.id || c.key_concept._id || "",
          ),
      );
    }
    if (modifiers?.isShuffled) {
      list = shuffleWithSeed(list, seed);
    }
    return list;
  }, [raw, modifiers, seed]);

  return { ...rest, data: projected } as typeof rest & { data: Flashcard[] };
};

export const useReviewFlashcard = () => {
  const { user } = useAuth();

  return useMutation<
    Flashcard[],
    Error,
    { flashcardId: string; quality: number }
  >({
    mutationFn: async ({
      flashcardId,
      quality = 0,
    }: {
      flashcardId: string;
      quality: number;
    }) => {
      return await reviewFlashcards(user?.uid!, flashcardId, quality);
    },
    mutationKey: ["reviewFlashcard", user?.uid!],
  });
};

export const useGetTranscript = (
  contentId: string,
  p0?: { enabled: boolean },
) => {
  const { user, loading } = useAuth();

  return useQuery({
    queryFn: async () => {
      return await getTranscripts(user ? user?.uid : "anonymous", contentId);
    },
    queryKey: ["getTranscripts", user ? user?.uid : "anonymous", contentId],
    enabled: !loading && p0?.enabled,
    retry: false,
  });
};

export const useStartSTT = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      title,
      spaceId,
    }: {
      title: string;
      spaceId?: string;
    }) => await startSTT(user ? user?.uid! : "anonymous", title, spaceId),
    mutationKey: ["startSTT"],
  });
};

export const useStartSTTQuery = (title: string, spaceId?: string) => {
  const { loading, user } = useAuth();

  return useQuery({
    queryFn: async () =>
      await startSTT(user ? user?.uid! : "anonymous", title, spaceId),
    queryKey: ["startSTT", title, spaceId],
    enabled: !loading,
  });
};

export const useAddSTT = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      contentId,
      text,
      startTime,
      spaceId,
    }: {
      contentId: string;
      text: string;
      startTime: number;
      spaceId?: string;
    }) => await addSTT(user?.uid!, contentId, text, startTime, spaceId),
    mutationKey: ["addSTT", user?.uid!],
  });
};

export const useEndSTT = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      contentId,
      contentUrl,
      spaceId,
    }: {
      contentId: string;
      contentUrl: string;
      spaceId?: string;
    }) => await endSTT(user?.uid!, contentId, contentUrl, spaceId),
    mutationKey: ["endSTT", user?.uid!],
  });
};

export const useGetKeyConcepts = (contentId: string) => {
  const { user, loading } = useAuth();

  return useQuery({
    queryFn: async () =>
      await getKeyConcepts(user ? user?.uid! : "anonymous", contentId),
    queryKey: ["getKeyConcepts", user ? user?.uid! : "anonymous", contentId],
    enabled: !loading,
    retry: false,
  });
};

export const useDeleteFlashcards = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contentId,
      flashcardIds,
    }: {
      contentId: string;
      flashcardIds: string[];
    }) => await deleteFlashcards(user?.uid!, contentId, flashcardIds),
    mutationKey: ["deleteFlashcards", user?.uid!],
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: flashcardsRawKey(user?.uid!, variables.contentId),
      });
      await queryClient.invalidateQueries({
        queryKey: flashcardsARawKey(user?.uid!, variables.contentId),
      });
      await queryClient.invalidateQueries({
        queryKey: [
          "getFlashcardActiveProgress",
          user?.uid!,
          variables.contentId,
        ],
      });
    },
  });
};

export const useUpdateFlashcards = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contentId,
      flashcards,
    }: {
      contentId: string;
      flashcards: UpdateFlashcard[];
    }) => await updateFlashcards(user?.uid!, contentId, flashcards),
    mutationKey: ["updateFlashcards", user?.uid!],
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: flashcardsRawKey(user?.uid!, variables.contentId),
      });
      await queryClient.invalidateQueries({
        queryKey: flashcardsARawKey(user?.uid!, variables.contentId),
      });
      await queryClient.invalidateQueries({
        queryKey: [
          "getFlashcardActiveProgress",
          user?.uid!,
          variables.contentId,
        ],
      });
    },
  });
};

export const useGenerateMoreFlashcards = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      contentId,
      concepts,
      count,
    }: {
      contentId: string;
      concepts: string[];
      count: number;
    }) => await generateMoreFlashcards(user?.uid!, contentId, concepts, count),
    mutationKey: ["generateMoreFlashcards", user?.uid!],
  });
};

export const useUpdateContent = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      contentId,
      content,
    }: {
      contentId: string;
      content: Partial<Content>;
    }) => await updateContent(user?.uid!, contentId, content),
    mutationKey: ["updateContent", user?.uid!],
  });
};

export const useGetNotes = (contentId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryFn: async () => await getNotes(user?.uid!, contentId),
    queryKey: ["getNotes", user?.uid!, contentId],
    enabled: !!user,
  });
};

export const useUpdateNotes = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contentId,
      note,
    }: {
      contentId: string;
      note: PartialBlock<DefaultBlockSchema>[];
    }) => await updateNotes(user?.uid!, contentId, note),
    mutationKey: ["updateNotes", user?.uid!],
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["getNotes", user?.uid!, variables.contentId],
      });
    },
  });
};

export const useStudyGuideQuestionsByContent = (
  contentId: string,
  keyConceptIds?: string[],
  questionTypes?: QuestionType[],
  enabled: boolean = true,
) => {
  const { user } = useAuth();

  return useQuery({
    queryFn: async () =>
      await fetchStudyGuideQuestionsByContent(
        user?.uid!,
        contentId,
        keyConceptIds,
        questionTypes,
      ),
    queryKey: [
      "getContentStudyGuideQuestions",
      user?.uid!,
      contentId,
      keyConceptIds,
      questionTypes,
    ],
    enabled: !!user && enabled && !!contentId,
  });
};

export const useSubmitStudyGuideAnswer = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      questionId,
      answer,
      contentId,
      isCompleted,
    }: {
      questionId: string;
      answer?: string;
      contentId: string;
      isCompleted?: boolean;
    }) =>
      await submitStudyGuideAnswer(
        user?.uid!,
        contentId,
        questionId,
        answer,
        isCompleted,
      ),
    mutationKey: ["studyGuideSubmitAnswer", user?.uid!],
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["getStudyGuideAnswers", user?.uid!, variables.contentId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["studyGuideLimit", user?.uid!],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "getStudyGuideConceptProgress",
          user?.uid!,
          variables.contentId,
        ],
      });
    },
  });
};

export const useStudyGuideAnswers = (
  contentId: string,
  questionIds?: string[],
  enabled: boolean = true,
) => {
  const { user, loading } = useAuth();

  return useQuery({
    queryFn: async () =>
      await fetchStudyGuideAnswers(user?.uid!, contentId, questionIds),
    queryKey: ["getStudyGuideAnswers", user?.uid!, contentId, questionIds],
    enabled: !!user && !loading && enabled,
  });
};

export const useDeleteStudyGuideAnswer = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contentId,
      answerIds,
      groupedKeyConceptIds,
    }: {
      contentId: string;
      answerIds?: string[];
      groupedKeyConceptIds?: string[];
    }) =>
      await deleteStudyGuideAnswer(
        user?.uid!,
        contentId,
        answerIds,
        groupedKeyConceptIds,
      ),
    mutationKey: ["deleteStudyGuideAnswer", user?.uid!],
    onSuccess: async (_, variables) => {
      await queryClient.refetchQueries({
        queryKey: [
          "getContentStudyGuideQuestions",
          user?.uid!,
          variables.contentId,
        ],
        exact: false,
      });

      await queryClient.refetchQueries({
        queryKey: ["getStudyGuideAnswers", user?.uid!, variables.contentId],
        exact: false,
      });

      await queryClient.refetchQueries({
        queryKey: [
          "getStudyGuideConceptProgress",
          user?.uid!,
          variables.contentId,
        ],
      });
    },
  });
};

export const useStudyGuideConceptProgress = (
  contentId: string,
  keyConceptIds?: string[],
) => {
  const { user } = useAuth();

  return useQuery({
    queryFn: async () =>
      await fetchStudyGuideConceptProgress(
        user?.uid!,
        contentId,
        keyConceptIds,
      ),
    queryKey: ["getStudyGuideConceptProgress", user?.uid!, contentId],
    enabled: !!user && !!contentId,
  });
};

export const useDeleteStudyGuideQuestion = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contentId,
      questionIds,
    }: {
      contentId: string;
      questionIds: string[];
    }) => await deleteStudyGuideQuestion(user?.uid!, contentId, questionIds),
    mutationKey: ["deleteStudyGuideQuestion", user?.uid!],
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: [
          "getContentStudyGuideQuestions",
          user?.uid!,
          variables.contentId,
        ],
      });
      await queryClient.invalidateQueries({
        queryKey: ["getStudyGuideAnswers", user?.uid!, variables.contentId],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "getStudyGuideConceptProgress",
          user?.uid!,
          variables.contentId,
        ],
      });
    },
  });
};

export const useRegenerateStudyGuideQuestions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contentId,
      groupedKeyConceptIds,
      questionTypes,
      difficulties,
    }: {
      contentId: string;
      groupedKeyConceptIds?: string[];
      questionTypes: QuestionType[];
      difficulties: QuizDifficulty[];
    }) =>
      await regenerateStudyGuideQuestions(
        user?.uid!,
        contentId,
        questionTypes,
        difficulties,
        groupedKeyConceptIds,
      ),
    mutationKey: ["regenerateStudyGuideQuestions", user?.uid!],
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: [
          "getContentStudyGuideQuestions",
          user?.uid!,
          variables.contentId,
          variables.groupedKeyConceptIds,
        ],
      });
      await queryClient.invalidateQueries({
        queryKey: ["getStudyGuideAnswers", user?.uid!, variables.contentId],
      });
      await queryClient.invalidateQueries({
        queryKey: [
          "getUserContentStudyGuidePreferences",
          user?.uid!,
          variables.contentId,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "getStudyGuideConceptProgress",
          user?.uid!,
          variables.contentId,
        ],
      });
    },
  });
};

export const useMutateStudyGuideQuestionsByContent = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contentId,
      groupedKeyConceptIds,
      questionTypes,
    }: {
      contentId: string;
      groupedKeyConceptIds?: string[];
      questionTypes?: QuestionType[];
    }) =>
      await fetchStudyGuideQuestionsByContent(
        user?.uid!,
        contentId,
        groupedKeyConceptIds,
        questionTypes,
      ),
    mutationKey: ["mutateContentStudyGuideQuestions", user?.uid!],
    onSuccess: async (_, variables) => {
      if (variables.groupedKeyConceptIds) {
        await queryClient.refetchQueries({
          queryKey: [
            "getContentStudyGuideQuestions",
            user?.uid!,
            variables.contentId,
            variables.groupedKeyConceptIds,
          ],
        });
      } else {
        await queryClient.refetchQueries({
          queryKey: [
            "getContentStudyGuideQuestions",
            user?.uid!,
            variables.contentId,
          ],
        });
      }
    },
  });
};

export const useMutateStudyGuideAnswers = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contentId,
      questionIds,
    }: {
      contentId: string;
      questionIds?: string[];
    }) => await fetchStudyGuideAnswers(user?.uid!, contentId, questionIds),
    mutationKey: ["mutateStudyGuideAnswers", user?.uid!],
    onSuccess: async (_, variables) => {
      if (variables.questionIds) {
        await queryClient.refetchQueries({
          queryKey: [
            "getStudyGuideAnswers",
            user?.uid!,
            variables.contentId,
            variables.questionIds,
          ],
        });
      } else {
        await queryClient.refetchQueries({
          queryKey: ["getStudyGuideAnswers", user?.uid!, variables.contentId],
        });
      }
    },
  });
};

export const useGetSummaryRanges = (contentId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryFn: async () => await getSummaryRanges(user?.uid!, contentId),
    queryKey: ["getSummaryRanges", user?.uid!, contentId],
    enabled: !!user && !!contentId,
  });
};

export const useStartContentConversation = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ spaceId }: { spaceId?: string }) =>
      await startContentConversation(user?.uid!, spaceId),
    mutationKey: ["startContentConversation", user?.uid!],
  });
};

export const useFlashcardsActiveRecallRaw = (contentId: string) => {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: flashcardsARawKey(user?.uid ?? "anonymous", contentId),
    queryFn: async () =>
      await getFlashcardsActiveRecall(user?.uid ?? "anonymous", contentId),
    enabled: !loading,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export const useGetFlashcardsActiveRecall = (
  contentId: string,
  modifiers?: FlashcardModifiers,
) => {
  const { data: raw, ...rest } = useFlashcardsActiveRecallRaw(contentId);

  const seed = useMemo(() => Math.random(), [modifiers?.isShuffled]);

  const projected = useMemo(() => {
    if (!raw) return [];

    let list = raw;
    if (modifiers?.showOnlyStarred) list = list.filter((c) => c.is_starred);
    if (
      modifiers?.selectedKeyConcepts &&
      modifiers.selectedKeyConcepts.length > 0
    ) {
      list = list.filter(
        (c) =>
          c.key_concept &&
          modifiers.selectedKeyConcepts?.includes(
            c.key_concept._id || c.key_concept.id || "",
          ),
      );
    }
    if (modifiers?.isShuffled) list = shuffleWithSeed(list, seed);
    return list;
  }, [raw, modifiers, seed]);

  return { ...rest, data: projected };
};

export const useGradeFlashcardsActiveRecall = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      flashcardId,
      rating,
    }: {
      flashcardId: string;
      rating: number;
    }) => await gradeFlashcardsActiveRecall(user?.uid!, flashcardId, rating),
    mutationKey: ["gradeFlashcardsActiveRecall", user?.uid!],
  });
};

export const flashcardsRawKey = (uid: string, cid: string) =>
  ["flashcardsRaw", uid, cid] as const;

export const flashcardsARawKey = (uid: string, cid: string) =>
  ["flashcardsARaw", uid, cid] as const;

export const useGetFlashcardActiveProgress = (
  contentId: string,
  isStarred: boolean = false,
  keyConceptIds: string[],
  p0: { enabled: boolean },
) => {
  const { user } = useAuth();

  return useQuery({
    queryFn: async () =>
      await getFlashcardActiveProgress(
        user?.uid!,
        contentId,
        isStarred,
        keyConceptIds,
      ),
    queryKey: [
      "getFlashcardActiveProgress",
      user?.uid!,
      contentId,
      isStarred,
      keyConceptIds,
    ],
    enabled: !!user && !!contentId && p0?.enabled,
  });
};

export const useGetFlashcardActiveReviewLogs = (
  contentId: string,
  flashcardIds: string[],
  p0: { enabled: boolean },
) => {
  const { user } = useAuth();

  return useQuery({
    queryFn: async () =>
      await getFlashcardActiveReviewLogs(user?.uid!, contentId, flashcardIds),
    queryKey: [
      "getFlashcardActiveReviewLogs",
      user?.uid!,
      contentId,
      flashcardIds,
    ],
    enabled: !!user && !!contentId && p0?.enabled,
  });
};

export const useGetAllFlashcardsActiveRecall = (
  contentId: string,
  p0: { enabled: boolean },
) => {
  const { user } = useAuth();

  return useQuery({
    queryFn: async () =>
      await getAllFlashcardsActiveRecall(user?.uid!, contentId),
    queryKey: ["getAllFlashcardsActiveRecall", user?.uid!, contentId],
    enabled: !!user && !!contentId && p0?.enabled,
  });
};

export const useYouTubePlaylist = () => {
  return useMutation<
    { playlistId: string; totalVideos: number; videos: VideoUrl[] },
    Error,
    { playlistUrl: string }
  >({
    mutationFn: async ({ playlistUrl }: { playlistUrl: string }) => {
      return await fetchYouTubePlaylist(playlistUrl);
    },
    mutationKey: ["youTubePlaylist"],
  });
};

export const useGenerateTTS = () => {
  return useMutation<TTSSession, Error, { text: string }>({
    mutationFn: async ({ text }: { text: string }) => {
      return await generateTTS(text);
    },
    mutationKey: ["generateTTS"],
  });
};
