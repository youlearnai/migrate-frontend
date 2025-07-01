import { customFetch } from "@/lib/custom-fetch";
import { isBackendError } from "@/lib/utils";
import {
  Content,
  Flashcard,
  KeyConcept,
  NoteResponse,
  Question,
  Seo,
  StudyGuideAnswer,
  StudyGuideConceptProgress,
  QuestionType,
  Transcript,
  UpdateFlashcard,
  UserContentSummaryRange,
  QuizDifficulty,
  FlashcardProgress,
  ActiveRecallFlashcard,
  FlashcardActiveReviewLogResponse,
  FlashcardActiveRecallAllResponse,
  VideoUrl,
} from "@/lib/types";
import { DefaultBlockSchema, PartialBlock } from "@blocknote/core";

export async function* addContent(
  userId: string,
  spaceId: string | undefined,
  contentURLs: string[],
  addToHistory: boolean,
  title?: string,
  sync?: boolean,
): AsyncGenerator<string, void, unknown> {
  const data = {
    user_id: userId,
    space_id: spaceId,
    content_urls: contentURLs,
    add_to_history: addToHistory,
    ...(title && { title: title }),
    ...(sync && { is_sync: sync }),
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/content/add`,
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

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    yield decoder.decode(value, { stream: true });
  }
}

export const deleteContent = async (
  userId: string,
  spaceId: string,
  contentIds: string[],
  deleteFromHistory: boolean,
): Promise<boolean> => {
  const data = {
    user_id: userId,
    space_id: spaceId,
    content_ids: contentIds,
    delete_from_history: deleteFromHistory,
  };

  try {
    const response = await customFetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/content/`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      },
    );

    return true;
  } catch (err) {
    console.error("Error deleting content:", err);
    return false;
  }
};

export const getContent = async (
  userId: string,
  contentId: string,
  spaceId?: string,
  addToHistory?: boolean,
  cookieHeader?: string,
): Promise<Content> => {
  const data = {
    user_id: userId,
    content_id: contentId,
    ...(spaceId && { space_id: spaceId }),
    add_to_history: addToHistory,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/content/get`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      credentials: userId === "anonymous" ? "omit" : "include",
      body: JSON.stringify(data),
    },
  );

  const content: Content = await response.json();
  return content;
};

export const checkContentInSpace = async (
  userId: string,
  contentId: string,
): Promise<string[]> => {
  const data = {
    user_id: userId,
    content_id: contentId,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/content/spaces`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    },
  );

  const content: { response: string[] } = await response.json();
  return content.response;
};

export const getFlashcards = async (
  userId: string,
  contentId: string,
): Promise<Flashcard[]> => {
  const data = {
    user_id: userId,
    content_id: contentId,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/content/flashcards`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      credentials: userId === "anonymous" ? "omit" : "include",
    },
  );

  const result: Flashcard[] = await response.json();
  return result;
};

export const reviewFlashcards = async (
  userId: string,
  flashcardId: string,
  quality: number,
): Promise<Flashcard[]> => {
  const data = {
    user_id: userId,
    flashcard_id: flashcardId,
    quality: quality,
  };

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/content/flashcards/review`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      credentials: userId === "anonymous" ? "omit" : "include",
    },
  );

  const result: Flashcard[] = await response.json();
  return result;
};

export const getTranscripts = async (
  userId: string,
  contentId: string,
): Promise<Transcript[]> => {
  const data = {
    user_id: userId,
    content_id: contentId,
  };

  try {
    const response = await customFetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/content/transcript`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: userId === "anonymous" ? "omit" : "include",
      },
      false,
    );

    const result: Transcript[] = await response.json();
    return result;
  } catch (error: unknown) {
    if (isBackendError(error)) {
      try {
        const parsedError = JSON.parse(error.message);
        return Promise.reject(parsedError);
      } catch {
        return Promise.reject({
          message: error || "An unknown error occurred",
        });
      }
    } else {
      return Promise.reject("An unknown error occurred");
    }
  }
};

export const startSTT = async (
  userId: string,
  title: string,
  spaceId?: string,
): Promise<Content> => {
  const data = {
    user_id: userId,
    title: title,
    ...(spaceId && { space_id: spaceId }),
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/content/stt/start`,
    {
      method: "POST",
      body: JSON.stringify(data),
      credentials: userId === "anonymous" ? "omit" : "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return (await response.json()) as Content;
};

export const addSTT = async (
  userId: string,
  contentId: string,
  text: string,
  startTime: number,
  spaceId?: string,
) => {
  const data = {
    user_id: userId,
    content_id: contentId,
    ...(spaceId && { space_id: spaceId }),
    chunk: {
      text: text,
      start: startTime,
    },
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/content/stt/add`,
    {
      method: "POST",
      body: JSON.stringify(data),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return await response.json();
};

export const endSTT = async (
  userId: string,
  contentId: string,
  contentUrl: string,
  spaceId?: string,
) => {
  const data = {
    user_id: userId,
    content_id: contentId,
    ...(spaceId && { space_id: spaceId }),
    content_url: contentUrl,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/content/stt/end`,
    {
      method: "POST",
      body: JSON.stringify(data),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return await response.json();
};

export const getKeyConcepts = async (
  userId: string,
  contentId: string,
  cookieHeader?: string,
): Promise<KeyConcept[]> => {
  const data = {
    user_id: userId,
    content_id: contentId,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/content/key_concepts`,
    {
      method: "POST",
      body: JSON.stringify(data),
      credentials: userId === "anonymous" ? "omit" : "include",
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
    },
  );

  return await response.json();
};

export const deleteFlashcards = async (
  userId: string,
  contentId: string,
  flashcardIds: string[],
): Promise<boolean> => {
  const data = {
    user_id: userId,
    content_id: contentId,
    flashcard_ids: flashcardIds,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/content/flashcards/delete/`,
    {
      method: "DELETE",
      body: JSON.stringify(data),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (response.status === 204) {
    return true;
  }

  return false;
};

export const updateFlashcards = async (
  userId: string,
  contentId: string,
  flashcards: UpdateFlashcard[],
): Promise<boolean> => {
  const data = {
    user_id: userId,
    content_id: contentId,
    flashcards: flashcards,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/content/flashcards/upsert/`,
    {
      method: "PUT",
      body: JSON.stringify(data),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (response.status === 204) {
    return true;
  }

  return false;
};

export const generateMoreFlashcards = async (
  userId: string,
  contentId: string,
  concepts: string[],
  count: number,
): Promise<boolean> => {
  const data = {
    user_id: userId,
    content_id: contentId,
    concepts: concepts,
    count: count,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/content/flashcards/generate`,
    {
      method: "POST",
      body: JSON.stringify(data),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return await response.json();
};

export const updateContent = async (
  userId: string,
  contentId: string,
  content: Partial<Content>,
): Promise<boolean> => {
  const data = {
    user_id: userId,
    content_id: contentId,
    ...content,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/content/`,
    {
      method: "PUT",
      body: JSON.stringify(data),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (response.status === 204) {
    return true;
  }

  return false;
};

export const getContentSeo = async (
  userId: string,
  contentId: string,
): Promise<Seo> => {
  const data = {
    user_id: userId,
    content_id: contentId,
  };

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/content/seo`,
    {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return await response.json();
};

export const getNotes = async (
  userId: string,
  contentId: string,
): Promise<NoteResponse> => {
  const data = {
    user_id: userId,
    content_id: contentId,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/content/notes/get`,
    {
      method: "POST",
      body: JSON.stringify(data),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return (await response.json()) as NoteResponse;
};

export const updateNotes = async (
  userId: string,
  contentId: string,
  note: PartialBlock<DefaultBlockSchema>[],
): Promise<boolean> => {
  const data = {
    user_id: userId,
    content_id: contentId,
    note: note,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/content/notes/`,
    {
      method: "PUT",
      body: JSON.stringify(data),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (response.status === 204) {
    return true;
  }

  return false;
};

export const fetchStudyGuideQuestionsByContent = async (
  userId: string,
  contentId: string,
  conceptGroupIds?: string[],
  questionTypes?: QuestionType[],
): Promise<Question[]> => {
  const data = {
    user_id: userId,
    content_id: contentId,
    concept_group_ids: conceptGroupIds,
    question_types: questionTypes,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/content/study_guide/question`,
    {
      method: "POST",
      body: JSON.stringify(data),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return await response.json();
};

export const submitStudyGuideAnswer = async (
  userId: string,
  contentId: string,
  questionId: string,
  answer?: string,
  isCompleted?: boolean,
): Promise<StudyGuideAnswer> => {
  const data = {
    user_id: userId,
    content_id: contentId,
    question_id: questionId,
    answer: answer,
    is_completed: isCompleted,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/content/study_guide/answer/create`,
    {
      method: "POST",
      body: JSON.stringify(data),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return (await response.json()) as StudyGuideAnswer;
};

export const fetchStudyGuideAnswers = async (
  userId: string,
  contentId: string,
  questionIds?: string[],
): Promise<StudyGuideAnswer[]> => {
  const data = {
    user_id: userId,
    content_id: contentId,
    question_ids: questionIds,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/content/study_guide/answer/`,
    {
      method: "POST",
      body: JSON.stringify(data),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return (await response.json()) as StudyGuideAnswer[];
};

export const deleteStudyGuideAnswer = async (
  userId: string,
  contentId: string,
  answerIds?: string[],
  conceptGroupIds?: string[],
): Promise<boolean> => {
  const data = {
    user_id: userId,
    content_id: contentId,
    answer_ids: answerIds,
    concept_group_ids: conceptGroupIds,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/content/study_guide/answer/delete`,
    {
      method: "DELETE",
      body: JSON.stringify(data),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return response.status === 204;
};

export const fetchStudyGuideQuestionsByIds = async (
  userId: string,
  contentId: string,
  questionIds: string[],
): Promise<Question[]> => {
  const data = {
    user_id: userId,
    content_id: contentId,
    question_ids: questionIds,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/content/study_guide/question/get`,
    {
      method: "POST",
      body: JSON.stringify(data),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return await response.json();
};

export const fetchStudyGuideConceptProgress = async (
  userId: string,
  contentId: string,
  keyConceptIds?: string[],
): Promise<StudyGuideConceptProgress> => {
  const data = {
    user_id: userId,
    content_id: contentId,
    key_concept_ids: keyConceptIds,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/content/study_guide/concept/progress`,
    {
      method: "POST",
      body: JSON.stringify(data),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return await response.json();
};

export const deleteStudyGuideQuestion = async (
  userId: string,
  contentId: string,
  questionIds: string[],
): Promise<boolean> => {
  const data = {
    user_id: userId,
    content_id: contentId,
    question_ids: questionIds,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/content/study_guide/question/delete`,
    {
      method: "DELETE",
      body: JSON.stringify(data),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return response.status === 204;
};

export const regenerateStudyGuideQuestions = async (
  userId: string,
  contentId: string,
  questionTypes: QuestionType[],
  difficulties: QuizDifficulty[],
  groupedKeyConceptIds?: string[],
): Promise<Question[]> => {
  if (questionTypes.length === 0) {
    throw new Error("Question types are required");
  }

  const data = {
    user_id: userId,
    content_id: contentId,
    concept_group_ids: groupedKeyConceptIds,
    difficulties: difficulties,
    question_types: questionTypes,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/content/study_guide/question/regenerate`,
    {
      method: "POST",
      body: JSON.stringify(data),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return await response.json();
};

export const getSummaryRanges = async (
  userId: string,
  contentId: string,
): Promise<UserContentSummaryRange> => {
  const data = {
    user_id: userId,
    content_id: contentId,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/content/summary/ranges`,
    {
      method: "POST",
      body: JSON.stringify(data),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return (await response.json()) as UserContentSummaryRange;
};

export const startContentConversation = async (
  userId: string,
  spaceId?: string,
): Promise<{
  content_id: string;
}> => {
  const data = {
    user_id: userId,
    space_id: spaceId,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/content/conversation/start`,
    {
      method: "POST",
      body: JSON.stringify(data),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return (await response.json()) as { content_id: string };
};

export const getFlashcardsActiveRecall = async (
  userId: string,
  contentId: string,
): Promise<ActiveRecallFlashcard[]> => {
  const data = {
    user_id: userId,
    content_id: contentId,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/content/flashcards/review`,
    {
      method: "POST",
      body: JSON.stringify(data),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return (await response.json()) as ActiveRecallFlashcard[];
};

export const gradeFlashcardsActiveRecall = async (
  userId: string,
  flashcardId: string,
  rating: number,
): Promise<boolean> => {
  const data = {
    user_id: userId,
    flashcard_id: flashcardId,
    rating: rating,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/content/flashcards/review/grade`,
    {
      method: "POST",
      body: JSON.stringify(data),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (response.status === 204) {
    return true;
  }

  return false;
};

export const getFlashcardActiveProgress = async (
  userId: string,
  contentId: string,
  isStarred: boolean,
  keyConceptIds: string[],
): Promise<FlashcardProgress> => {
  const data = {
    user_id: userId,
    content_id: contentId,
    is_starred: isStarred,
    key_concept_ids: keyConceptIds,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/content/flashcards/active/progress`,
    {
      method: "POST",
      body: JSON.stringify(data),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return (await response.json()) as FlashcardProgress;
};

export const getFlashcardActiveReviewLogs = async (
  userId: string,
  contentId: string,
  flashcardIds: string[],
): Promise<FlashcardActiveReviewLogResponse> => {
  const data = {
    user_id: userId,
    content_id: contentId,
    flashcard_ids: flashcardIds,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/content/flashcards/review_logs`,
    {
      method: "POST",
      body: JSON.stringify(data),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return (await response.json()) as FlashcardActiveReviewLogResponse;
};

export const getAllFlashcardsActiveRecall = async (
  userId: string,
  contentId: string,
): Promise<FlashcardActiveRecallAllResponse> => {
  const data = {
    user_id: userId,
    content_id: contentId,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/content/flashcards/review/all`,
    {
      method: "POST",
      body: JSON.stringify(data),
      credentials: userId === "anonymous" ? "omit" : "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return (await response.json()) as FlashcardActiveRecallAllResponse;
};

export const fetchYouTubePlaylist = async (
  playlistUrl: string,
): Promise<{ playlistId: string; totalVideos: number; videos: VideoUrl[] }> => {
  const response = await fetch("/api/youtube-playlist", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ playlistUrl }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch playlist");
  }

  return response.json();
};
