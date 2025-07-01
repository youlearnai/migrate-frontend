import { customFetch } from "@/lib/custom-fetch";
import {
  Seo,
  Space,
  SpaceContent,
  SpaceDetails,
  QuestionType,
  UserExam,
} from "@/lib/types";

export const getSpace = async (
  userId: string,
  spaceId: string,
  cookieHeader?: string,
): Promise<SpaceDetails | null> => {
  try {
    const response = await customFetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/space/${userId}/${spaceId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
        credentials: userId === "anonymous" ? "omit" : "include",
      },
    );

    const data: SpaceDetails = await response.json();

    return data;
  } catch (err) {
    return null;
  }
};

export const addSpace = async (
  userId: string,
  spaceName: string,
  visibility: string,
): Promise<Space | null> => {
  try {
    const response = await customFetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/space/add`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          user_id: userId,
          space_name: spaceName,
          visibility: visibility,
        }),
      },
    );

    const data: Space = await response.json();

    return data;
  } catch (err) {
    return null;
  }
};

export const deleteSpace = async (
  userId: string,
  spaceId: string,
): Promise<boolean> => {
  try {
    const response = await customFetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/space/`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          user_id: userId,
          space_id: spaceId,
        }),
      },
    );

    return true;
  } catch (err) {
    return false;
  }
};

export const updateSpace = async (
  userId: string,
  spaceId: string,
  spaceName: string,
  description: string,
  visibility: "private" | "public",
): Promise<SpaceDetails> => {
  const data = {
    user_id: userId,
    space_id: spaceId,
    space_name: spaceName,
    description: description,
    visibility: visibility,
  };

  try {
    const response = await customFetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/space/`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      },
    );

    const spaceDetails: SpaceDetails = await response.json();
    return spaceDetails;
  } catch (err) {
    throw new Error("Failed to update space");
  }
};

export const updateSpaceContent = async (
  userId: string,
  spaceId: string,
  spaceContents: SpaceContent[],
) => {
  const data = {
    user_id: userId,
    space_id: spaceId,
    space_contents: spaceContents,
  };

  try {
    const response = await customFetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/space/content/`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      },
    );

    return true;
  } catch (err) {
    return false;
  }
};

export const getSpaceSeo = async (spaceId: string): Promise<Seo> => {
  const data = {
    space_id: spaceId,
  };

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/space/seo`,
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

export const createSpaceExam = async (
  userId: string,
  spaceId: string,
  contentIds: string[],
  questionTypes: QuestionType[],
  pastPaperUrls?: string[],
  numQuestions?: number,
  examDate?: Date,
  examDuration?: number,
): Promise<UserExam> => {
  const data = {
    user_id: userId,
    space_id: spaceId,
    content_ids: contentIds,
    past_paper_urls: pastPaperUrls,
    question_types: questionTypes,
    num_questions: numQuestions,
    exam_date: examDate,
    exam_duration: examDuration,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/space/exam/create`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      credentials: "include",
    },
  );

  const userExam: UserExam = await response.json();

  return userExam;
};
