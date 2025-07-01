import { customFetch } from "@/lib/custom-fetch";
import {
  Exam,
  SpaceExamAnswer,
  SpaceExamProgress,
  UserExam,
} from "@/lib/types";

export const getSpaceExam = async (
  userId: string,
  examId: string,
  cookieHeader?: string,
): Promise<Exam> => {
  const examData = {
    user_id: userId,
    exam_id: examId,
  };
  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/space/exam/get`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      credentials: "include",
      body: JSON.stringify(examData),
    },
  );

  const data: Exam = await response.json();

  return data;
};

export const saveSpaceExam = async (
  userId: string,
  examId: string,
  questionId: string,
  answer: string | null,
  isSkipped: boolean = false,
): Promise<boolean> => {
  const examData = {
    user_id: userId,
    exam_id: examId,
    question_id: questionId,
    answer: answer,
    is_skipped: isSkipped,
  };
  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/space/exam/save`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(examData),
      credentials: "include",
    },
  );

  if (response.status === 204) {
    return true;
  }

  return false;
};

export const submitSpaceExam = async (
  userId: string,
  examId: string,
): Promise<boolean> => {
  const examData = {
    user_id: userId,
    exam_id: examId,
  };
  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/space/exam/submit`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(examData),
      credentials: "include",
    },
  );

  if (response.status === 204) {
    return true;
  }

  return false;
};

export const getSpaceExamAnswers = async (
  userId: string,
  examId: string,
  cookieHeader?: string,
): Promise<SpaceExamAnswer> => {
  const examData = {
    user_id: userId,
    exam_id: examId,
  };
  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/space/exam/answers/get`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      credentials: "include",
      body: JSON.stringify(examData),
    },
  );

  const data: SpaceExamAnswer = await response.json();

  return data;
};

export const getSpaceExamProgress = async (
  userId: string,
  examId: string,
  cookieHeader?: string,
): Promise<SpaceExamProgress> => {
  const examData = {
    user_id: userId,
    exam_id: examId,
  };
  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/space/exam/progress`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      credentials: "include",
      body: JSON.stringify(examData),
    },
  );

  const data: SpaceExamProgress = await response.json();

  return data;
};

export const resetSpaceExam = async (
  userId: string,
  examId: string,
  cookieHeader?: string,
) => {
  const examData = {
    user_id: userId,
    exam_id: examId,
  };
  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/space/exam/answers/reset`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      credentials: "include",
      body: JSON.stringify(examData),
    },
  );

  if (response.status === 204) {
    return true;
  }

  return false;
};

export const getExamList = async (
  userId: string,
  spaceId: string,
  cookieHeader?: string,
): Promise<UserExam[]> => {
  const examData = {
    user_id: userId,
    space_id: spaceId,
  };
  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/space/exam/list`,
    {
      method: "POST",
      credentials: "include",
      body: JSON.stringify(examData),
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
    },
  );

  const data: UserExam[] = await response.json();

  return data;
};
