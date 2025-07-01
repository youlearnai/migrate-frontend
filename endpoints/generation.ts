import { customFetch } from "@/lib/custom-fetch";
import {
  AddFlashcardFromChatRequest,
  Chapter,
  Chat,
  Collection,
  Content,
  LearnSuggestion,
  LivekitConnectionResponse,
  SummaryResponse,
} from "@/lib/types";

export const chatHistory = async (
  userId: string,
  chatbotType: "content" | "space",
  contentId: string,
  spaceId: string | undefined,
): Promise<Chat[] | undefined> => {
  const data = {
    user_id: userId,
    chatbot_type: chatbotType,
    content_id: contentId,
    space_id: spaceId,
  };

  try {
    const response = await customFetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/generation/chat/history`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      },
    );

    const result: Chat[] = await response.json();
    return result;
  } catch (err) {
    console.error(err);
  }
};

export const chat = async (
  userId: string,
  spaceId: string | undefined,
  contentId: string,
  query: string,
  getExistingChatHistory: boolean,
  saveChatHistory: boolean,
  quoteText?: string,
  quoteId?: string,
  imageUrls?: string[],
  chatModelId?: string,
  agent?: boolean,
  questionId?: string,
  isWebSearch?: boolean,
  currentSource?: number,
  contextContents?: Content[],
) => {
  const data = {
    user_id: userId,
    space_id: spaceId,
    content_id: contentId,
    query: query,
    get_existing_chat_history: getExistingChatHistory,
    image_urls: imageUrls,
    save_chat_history: saveChatHistory,
    chat_model_id: chatModelId,
    agent: agent,
    question_id: questionId,
    ...(quoteText &&
      quoteId && {
        chat_quote: {
          text: quoteText,
          ref_id: quoteId,
        },
      }),
    web_search: isWebSearch,
    current_source: currentSource,
    context_contents: contextContents,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/generation/chat`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      credentials: userId === "anonymous" ? "omit" : "include",
    },
  );

  return response;
};

export const generateQuestions = async (
  userId: string,
  contentId: string,
): Promise<string[]> => {
  const data = {
    user_id: userId,
    content_id: contentId,
  };

  try {
    const response = await customFetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/generation/content/chat_prompts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: userId === "anonymous" ? "omit" : "include",
        body: JSON.stringify(data),
      },
    );

    const result: string[] = await response.json();
    return result;
  } catch (error) {
    throw error;
  }
};

export const generateSummary = async (
  userId: string,
  contentId: string,
  customSummary?: string,
  cookieHeader?: string,
  summaryRange?: number[][],
): Promise<SummaryResponse> => {
  const data = {
    user_id: userId,
    content_id: contentId,
    prompt_id: customSummary,
    summary_range: summaryRange,
  };

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (cookieHeader) {
      headers.Cookie = cookieHeader;
    }

    const response = await customFetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/generation/content/summary`,
      {
        method: "POST",
        headers,
        credentials: userId === "anonymous" ? "omit" : "include",
        body: JSON.stringify(data),
      },
    );

    const result: SummaryResponse = await response.json();
    return result;
  } catch (error) {
    console.error("Generate Summary Error:", error);
    throw error;
  }
};

export async function* generateChapters(userId: string, contentId: string) {
  const data = {
    user_id: userId,
    content_id: contentId,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/generation/content/chapters`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      credentials: userId === "anonymous" ? "omit" : "include",
    },
  );

  if (!response.body) throw new Error("No response body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split("}{");
    if (parts.length > 1) {
      for (let i = 0; i < parts.length - 1; i++) {
        let jsonPart = parts[i];
        if (i === 0) jsonPart += "}";
        else if (i === parts.length - 1) jsonPart = "{" + jsonPart;
        else jsonPart = "{" + jsonPart + "}";

        try {
          const parsedChapter = JSON.parse(jsonPart) as Chapter;
          yield parsedChapter;
        } catch (error) {
          continue;
        }
      }
      buffer = "{" + parts[parts.length - 1];
    }
  }

  if (buffer) {
    try {
      const parsedChapter = JSON.parse(buffer) as Chapter;
      yield parsedChapter;
    } catch (error) {
      console.error("Failed to parse JSON at the end:", buffer, error);
    }
  }
}

export const deleteChatHistory = async (
  userId: string,
  spaceId: string | undefined,
  contentId: string | undefined,
) => {
  const data = {
    user_id: userId,
    space_id: spaceId,
    content_id: contentId,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/generation/chat/history/`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    },
  );

  if (response.status === 204) {
    return true;
  }

  return false;
};

export const createQuizAnswerFeedback = async (
  userId: string,
  chatbotMessageId: string,
  questionIdx: number,
  answer?: string,
  isCompleted?: boolean,
  quizId?: string,
): Promise<Chat> => {
  const requestPayload = {
    user_id: userId,
    chatbot_message_id: chatbotMessageId,
    question_idx: questionIdx,
    answer: answer,
    is_completed: isCompleted,
    quiz_id: quizId,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/generation/chat/tools/quiz/create_answer`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
      credentials: "include",
    },
  );

  const feedbackResponse: Chat = await response.json();
  return feedbackResponse;
};

export const deleteQuizAnswer = async (
  userId: string,
  chatbotMessageId: string,
  questionIdx?: number,
  quizId?: string,
): Promise<Chat> => {
  const requestPayload = {
    user_id: userId,
    chatbot_message_id: chatbotMessageId,
    question_idx: questionIdx,
    quiz_id: quizId,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/generation/chat/tools/quiz/delete_answer`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(requestPayload),
    },
  );

  const result: Chat = await response.json();
  return result;
};

export const generateLearnSuggestions = async (
  userId: string,
  spaceId: string | undefined,
  contentId: string,
  currentSource?: number,
): Promise<LearnSuggestion[]> => {
  const data = {
    user_id: userId,
    content_id: contentId,
    space_id: spaceId,
    current_source: currentSource,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/generation/chat/suggestions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      credentials: "include",
    },
  );

  const result: LearnSuggestion[] = await response.json();
  return result;
};

export const createLivekitConnection = async (
  userId: string,
  contentId: string,
  spaceId?: string,
): Promise<LivekitConnectionResponse> => {
  const data = {
    user_id: userId,
    content_id: contentId,
    space_id: spaceId,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/generation/connection/create`,
    {
      method: "POST",
      body: JSON.stringify(data),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return (await response.json()) as LivekitConnectionResponse;
};

export const addFlashcardFromChat = async (
  userId: string,
  contentId: string,
  flashcards: AddFlashcardFromChatRequest[],
): Promise<{
  content: Collection;
}> => {
  const data = {
    user_id: userId,
    content_id: contentId,
    flashcards: flashcards,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/generation/chat/tools/flashcards/save`,
    {
      method: "POST",
      body: JSON.stringify(data),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return (await response.json()) as {
    content: Collection;
  };
};
