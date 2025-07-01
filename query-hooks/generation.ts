import {
  addFlashcardFromChat,
  chat,
  chatHistory,
  createLivekitConnection,
  createQuizAnswerFeedback,
  deleteChatHistory,
  deleteQuizAnswer,
  generateChapters,
  generateLearnSuggestions,
  generateQuestions,
  generateSummary,
} from "@/endpoints/generation";
import useAuth from "@/hooks/use-auth";
import { useChatLimitBannerStore } from "@/hooks/use-chat-limit-banner-store";
import { useChatLoadingStore } from "@/hooks/use-chat-loading-store";
import { useChatStore } from "@/hooks/use-chat-store";
import { useErrorStore } from "@/hooks/use-error-store";
import {
  AddFlashcardFromChatRequest,
  Chapter,
  Chat,
  Content,
  ResponseChunk,
  StreamChatChunk,
} from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { flashcardsRawKey } from "./content";
import { MIN_CONSECUTIVE_SOURCES_TO_COMBINE } from "@/lib/utils";

const isSourceStreamChunk = (c: StreamChatChunk) =>
  c.type === "source" ||
  c.type === "space_source" ||
  c.type === "web_search_source";

const createSourceBufferHandler = (
  queryClient: ReturnType<typeof useQueryClient>,
  queryKey: (string | undefined)[],
  updateAIMessage: (oldData: Chat[], chunk: StreamChatChunk) => Chat[],
) => {
  const buffer: StreamChatChunk[] = [];

  const emitDelta = (deltaStr: string) => {
    const synthetic: StreamChatChunk = {
      type: "response",
      delta: deltaStr,
    } as StreamChatChunk;
    queryClient.setQueryData<Chat[]>(queryKey, (old = []) =>
      updateAIMessage(old, synthetic),
    );
  };

  const flush = () => {
    if (buffer.length === 0) return;
    if (buffer.length >= MIN_CONSECUTIVE_SOURCES_TO_COMBINE) {
      const combined = buffer.map((b) => b.delta).join("");
      emitDelta(`<sources>${combined}</sources>`);
    } else {
      buffer.forEach((b) => emitDelta(b.delta));
    }
    buffer.length = 0;
  };

  const handleChunk = (chunk: StreamChatChunk) => {
    if (isSourceStreamChunk(chunk)) {
      buffer.push(chunk);
    } else {
      flush();
      // propagate normal chunk
      queryClient.setQueryData<Chat[]>(queryKey, (old = []) =>
        updateAIMessage(old, chunk),
      );
    }
  };

  return { handleChunk, flush };
};

const invalidateQueriesBasedOnChunks = (
  queryClient: ReturnType<typeof useQueryClient>,
  message: Chat | undefined,
  userId: string,
  contentId: string,
  spaceId?: string,
) => {
  if (!message) return;

  const chunkTypes = message.response_chunks?.map((chunk) => chunk.type);

  if (chunkTypes.includes("quiz")) {
    queryClient.invalidateQueries({
      queryKey: ["getStudyGuideConceptProgress", userId, contentId],
    });
  }

  if (chunkTypes.includes("flashcards")) {
    queryClient.invalidateQueries({
      queryKey: flashcardsRawKey(userId, contentId),
    });
  }
};

export const useChatHistory = (
  spaceId: string | undefined,
  chatbotType: "space" | "content",
  contentId: string,
) => {
  const { user } = useAuth();

  return useQuery({
    queryFn: async () =>
      await chatHistory(user?.uid!, chatbotType, contentId, spaceId),
    queryKey: ["chatHistory", chatbotType, contentId, spaceId],
    enabled: !!user,
  });
};

export const useChat = () => {
  const { streaming, setStreaming, loading, setLoading } =
    useChatLoadingStore();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { openModal } = useErrorStore();
  const { setIsOpen } = useChatLimitBannerStore();
  const { setMessageForContent } = useChatStore();

  const mutation = useMutation({
    mutationFn: async ({
      spaceId,
      contentId,
      query,
      getExistingChatHistory,
      saveChatHistory,
      quoteText,
      quoteId,
      imageUrls,
      chatModelId,
      agent,
      questionId,
      isWebSearch,
      currentSource,
      contextContents,
    }: {
      spaceId: string | undefined;
      contentId: string;
      query: string;
      getExistingChatHistory: boolean;
      saveChatHistory: boolean;
      quoteText?: string;
      quoteId?: string;
      imageUrls?: string[];
      chatModelId?: string;
      agent?: boolean;
      questionId?: string;
      isWebSearch?: boolean;
      currentSource?: number;
      contextContents?: Content[];
    }) =>
      await chat(
        user ? user?.uid! : "anonymous",
        spaceId,
        contentId,
        query,
        getExistingChatHistory,
        saveChatHistory,
        quoteText,
        quoteId,
        imageUrls,
        chatModelId,
        agent,
        questionId,
        isWebSearch,
        currentSource,
        contextContents,
      ),
    onMutate: async (variables) => {
      setLoading(true);
      setStreaming(true);
      const queryKey = [
        "chatHistory",
        variables.spaceId ? "space" : "content",
        variables.contentId,
        variables.spaceId,
      ];

      await queryClient.cancelQueries({ queryKey });

      const previousChats = queryClient.getQueryData<Chat[]>(queryKey);

      const newUserMessage: Chat = {
        _id: `user-${Date.now()}`,
        message: variables.query,
        response: "",
        response_chunks: [],
        created_at: new Date().toISOString(),
        chatbot_type: variables.spaceId ? "space" : "content",
        chat_quote: {
          text: variables.quoteText!,
          ref_id: variables.quoteId!,
        },
        image_urls: variables.imageUrls,
        agent: variables.agent,
        question_id: variables.questionId,
        context_contents: variables.contextContents,
      };

      const newAIMessage: Chat = {
        _id: `ai-${Date.now()}`,
        message: "",
        response: "",
        response_chunks: [],
        created_at: new Date().toISOString(),
        chatbot_type: variables.spaceId ? "space" : "content",
        question_id: variables.questionId,
      };

      queryClient.setQueryData<Chat[]>(queryKey, (old = []) => [
        ...old,
        newUserMessage,
        newAIMessage,
      ]);

      return { previousChats, newAIMessage };
    },
    onSuccess: async (response, variables, context) => {
      setLoading(true);
      setStreaming(true);
      if (!response?.body || !context) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let messageType = "loading";

      const queryKey = [
        "chatHistory",
        variables.spaceId ? "space" : "content",
        variables.contentId,
        variables.spaceId,
      ];

      // Updates the AI message with new chunks from the stream
      // Handles both merging with existing chunks and creating new ones
      const updateAIMessage = (
        oldData: Chat[] = [],
        currentChunk: StreamChatChunk,
      ) => {
        return oldData.map((chat) => {
          if (chat._id === context.newAIMessage._id) {
            const lastChunk =
              chat.response_chunks[chat.response_chunks.length - 1];
            const shouldMerge =
              chat.response_chunks.length > 0 &&
              lastChunk.type === currentChunk.type &&
              !lastChunk.done;

            return {
              ...chat,
              response_chunks: shouldMerge
                ? [
                    // Keep all chunks except the last one
                    ...chat.response_chunks.slice(0, -1),
                    // Merge the new content with the last chunk
                    {
                      ...chat.response_chunks[chat.response_chunks.length - 1],
                      content:
                        chat.response_chunks[chat.response_chunks.length - 1]
                          .content + currentChunk.delta,
                    } as ResponseChunk,
                  ]
                : [
                    // If types don't match, add as a new chunk
                    ...chat.response_chunks,
                    {
                      ...currentChunk,
                      content: currentChunk.delta,
                    } as ResponseChunk,
                  ],
            };
          }
          return chat;
        });
      };

      const { handleChunk, flush } = createSourceBufferHandler(
        queryClient,
        queryKey,
        updateAIMessage,
      );

      const streamReader = new ReadableStream({
        async start(controller) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              // Flush any remaining buffered sources before finishing
              flush();
              setLoading(false);
              break;
            }
            const unparsedChunk = decoder.decode(value, { stream: true });

            const chunks = unparsedChunk
              .split("}{")
              .map((chunk, i, arr) =>
                arr.length === 1
                  ? chunk
                  : i === 0
                    ? chunk + "}"
                    : i === arr.length - 1
                      ? "{" + chunk
                      : "{" + chunk + "}",
              );

            for (const chunkStr of chunks) {
              try {
                const chunk = JSON.parse(chunkStr) as StreamChatChunk;

                if (chunk.type === "error") {
                  setStreaming(false);
                  setLoading(false);
                  const status = chunk.status;
                  const statusText = chunk.delta;
                  const service = chunk.service;
                  if (!user && status === 402) {
                    openModal(
                      {
                        status: 401,
                        statusText,
                        service,
                      },
                      { source: `chat-${statusText}` },
                    );
                  } else {
                    openModal(
                      {
                        status,
                        statusText,
                        service,
                      },
                      { source: `chat-${statusText}` },
                    );
                  }
                  setMessageForContent(variables.contentId, variables.query);
                  continue;
                }

                if (chunk.delta === "done" && "title" in chunk) {
                  const currentData =
                    queryClient.getQueryData<Chat[]>(queryKey) || [];

                  const aiMessageIndex = currentData.findIndex(
                    (chat) => chat._id === context.newAIMessage._id,
                  );

                  if (aiMessageIndex >= 0) {
                    const updatedData = [...currentData];
                    const aiMessage = updatedData[aiMessageIndex];

                    const existingChunkIndex =
                      aiMessage.response_chunks.findIndex(
                        (rc) => rc.type === chunk.type && !rc.done,
                      );

                    const newChunk = {
                      type: chunk.type,
                      content: "",
                      title: chunk.title as string,
                      done: true,
                    } as ResponseChunk;

                    if (existingChunkIndex >= 0) {
                      const existingChunk =
                        aiMessage.response_chunks[existingChunkIndex];

                      newChunk.content = existingChunk.content;

                      aiMessage.response_chunks = [
                        ...aiMessage.response_chunks.slice(
                          0,
                          existingChunkIndex,
                        ),
                        newChunk,
                        ...aiMessage.response_chunks.slice(
                          existingChunkIndex + 1,
                        ),
                      ];
                    } else {
                      aiMessage.response_chunks = [
                        ...aiMessage.response_chunks,
                        newChunk,
                      ];
                    }

                    queryClient.setQueryData(queryKey, updatedData);
                  }
                  continue;
                }

                messageType = chunk.type;
                controller.enqueue(value);
                setStreaming(false);
                handleChunk(chunk);
              } catch (error) {
                console.error("Error processing chunk:", error);
              }
            }
          }
          controller.close();
          queryClient.invalidateQueries({ queryKey });
          queryClient.invalidateQueries({
            queryKey: ["agenticChatLimit", user?.uid || "anonymous"],
          });
          queryClient.invalidateQueries({
            queryKey: ["totalChatLimit", user?.uid || "anonymous"],
          });

          const currentAIMessage = queryClient
            .getQueryData<Chat[]>(queryKey)
            ?.find((chat: Chat) => chat._id === context.newAIMessage._id);

          invalidateQueriesBasedOnChunks(
            queryClient,
            currentAIMessage,
            user?.uid || "anonymous",
            variables.contentId,
            variables.spaceId,
          );

          setIsOpen(true);
        },
      });

      return new Response(streamReader);
    },
    onError: (error, variables, context) => {
      setStreaming(false);
      setLoading(false);
      const queryKey = [
        "chatHistory",
        variables.spaceId ? "space" : "content",
        variables.contentId,
        variables.spaceId,
      ];
      queryClient.setQueryData(queryKey, context?.previousChats);
      queryClient.invalidateQueries({
        queryKey: ["totalChatLimit", user?.uid || "anonymous"],
      });
      setMessageForContent(variables.contentId, variables.query);
    },
  });

  return { ...mutation, loading, streaming };
};

export const useGenerateQuestions = (contentId: string, chats: Chat[]) => {
  const { user, loading } = useAuth();

  return useQuery({
    queryFn: async () => await generateQuestions(user?.uid!, contentId),
    queryKey: ["generateQuestions", contentId],
    enabled: !!user && !!contentId,
  });
};

export const useGenerateSummary = (
  contentId: string,
  enabled = true,
  customSummary?: string,
  summaryRange?: number[][],
) => {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryFn: async () => {
      try {
        const result = await generateSummary(
          user ? user?.uid : "anonymous",
          contentId,
          customSummary,
          undefined,
          summaryRange,
        );
        queryClient.invalidateQueries({
          queryKey: ["summaryLimit", user?.uid || "anonymous"],
        });
        queryClient.invalidateQueries({
          queryKey: ["getSummaryRanges", user?.uid!, contentId],
        });
        return result;
      } catch (error) {
        queryClient.invalidateQueries({
          queryKey: ["summaryLimit", user?.uid || "anonymous"],
        });
        throw error;
      }
    },
    queryKey: ["generateSummary", contentId],
    enabled: !loading && enabled,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export const useGenerateChapters = (
  contentId: string,
  options?: { enabled: boolean },
) => {
  const { user, loading } = useAuth();

  return useQuery({
    queryKey: ["generateChapters", user ? user?.uid : "anonymous", contentId],
    queryFn: async () => {
      const userId = user ? user?.uid : "anonymous";
      const generator = generateChapters(userId, contentId);

      let chapters: Chapter[] = [];

      try {
        for await (const chapter of generator) {
          chapters.push(chapter);
        }
      } catch (error) {}

      return chapters;
    },
    enabled: !loading && options?.enabled,
    refetchOnWindowFocus: false,
  });
};

export const useClearChatHistory = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contentId,
      spaceId,
    }: {
      contentId: string | undefined;
      spaceId: string | undefined;
    }) => await deleteChatHistory(user?.uid!, spaceId, contentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "chatHistory",
          variables.spaceId ? "space" : "content",
          variables.contentId,
          variables.spaceId,
        ],
      });
    },
  });
};

export const useGenerateSummaryMutation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contentId,
      customSummary,
      summaryRange,
    }: {
      contentId: string;
      customSummary?: string;
      summaryRange?: number[][];
    }) => {
      await queryClient.setQueryData(["generateSummary", contentId], () => []);
      return generateSummary(
        user?.uid || "anonymous",
        contentId,
        customSummary,
        undefined,
        summaryRange,
      );
    },
    onSuccess: async (data, variables) => {
      await queryClient.refetchQueries({
        queryKey: ["generateSummary", variables.contentId as string],
      });
      await queryClient.setQueryData(
        ["generateSummary", variables.contentId as string],
        () => data,
      );
      await queryClient.invalidateQueries({
        queryKey: ["summaryLimit", user?.uid],
      });
      await queryClient.invalidateQueries({
        queryKey: [
          "getSummaryRanges",
          user?.uid!,
          variables.contentId as string,
        ],
      });
    },
    onError: async (error, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["generateSummary", variables.contentId as string],
      });
    },
  });
};

export const useCreateQuizAnswerFeedbackGenerations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      chatbotMessageId,
      questionIdx,
      answer,
      isCompleted,
      quizId,
    }: {
      chatbotMessageId: string;
      questionIdx: number;
      answer?: string;
      isCompleted?: boolean;
      quizId?: string;
    }) =>
      await createQuizAnswerFeedback(
        user?.uid!,
        chatbotMessageId,
        questionIdx,
        answer,
        isCompleted,
        quizId,
      ),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({
        queryKey: [
          "chatHistory",
          data.space?.id ? "space" : "content",
          data.content?.id,
          data.space?.id,
        ],
      });
    },
  });
};

export const useDeleteQuizAnswerGenerations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      chatbotMessageId,
      questionIdx,
      quizId,
      spaceId,
    }: {
      chatbotMessageId: string;
      questionIdx?: number;
      quizId?: string;
      spaceId?: string;
    }) =>
      await deleteQuizAnswer(user?.uid!, chatbotMessageId, questionIdx, quizId),
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: [
          "chatHistory",
          variables.spaceId ? "space" : "content",
          data.content?.id,
          data.space?.id,
        ],
      });
    },
  });
};

export const useGenerateLearnSuggestions = (
  contentId: string,
  spaceId: string | undefined,
  currentSource?: number,
  p0 = {
    enabled: true,
  },
) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: [
      "generateLearnSuggestions",
      user ? user?.uid : "anonymous",
      contentId,
      spaceId,
    ],
    queryFn: async () =>
      await generateLearnSuggestions(
        user?.uid!,
        spaceId,
        contentId,
        currentSource,
      ),
    enabled: !!user && !!contentId && p0?.enabled,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export const useCreateLivekitConnection = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      contentId,
      spaceId,
    }: {
      contentId: string;
      spaceId?: string;
    }) => await createLivekitConnection(user?.uid!, contentId, spaceId),
    mutationKey: ["createLivekitConnection"],
  });
};

export const useAddFlashcardFromChat = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contentId,
      flashcards,
    }: {
      contentId: string;
      flashcards: AddFlashcardFromChatRequest[];
    }) => await addFlashcardFromChat(user?.uid!, contentId, flashcards),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({
        queryKey: flashcardsRawKey(user?.uid!, data.content?.id as string),
      });
    },
  });
};
