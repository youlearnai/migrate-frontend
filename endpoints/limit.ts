import { customFetch } from "@/lib/custom-fetch";
import { Limit, PricingLimit, SummaryLimit } from "@/lib/types";

export const getAgentChatLimit = async (
  userId: string,
): Promise<Limit | null> => {
  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/limit/chat/agent/${userId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: userId === "anonymous" ? "omit" : "include",
    },
  );

  const data: Limit = await response.json();
  return data;
};

export const getTotalChatLimit = async (userId: string): Promise<Limit> => {
  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/limit/chat/total/${userId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: userId === "anonymous" ? "omit" : "include",
    },
  );

  const data: Limit = await response.json();
  return data;
};

export const getVoiceChatLimit = async (
  userId: string,
): Promise<Limit | null> => {
  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/limit/chat/voice/${userId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: userId === "anonymous" ? "omit" : "include",
    },
  );

  const data: Limit = await response.json();
  return data;
};

export const getPricingLimit = async (
  userId: string,
): Promise<PricingLimit> => {
  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/limit/pricing/${userId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    },
  );

  const data: PricingLimit = await response.json();
  return data;
};

export const getSummaryLimit = async (
  userId: string,
): Promise<SummaryLimit> => {
  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/limit/summary/${userId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    },
  );

  const data: SummaryLimit = await response.json();
  return data;
};

export const getStudyGuideLimit = async (userId: string): Promise<Limit> => {
  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/limit/question_answer/${userId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    },
  );

  const data: Limit = await response.json();
  return data;
};

export const getAddContentLimit = async (userId: string): Promise<Limit> => {
  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/limit/content/add/${userId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    },
  );

  const data: Limit = await response.json();
  return data;
};

export const getExamGenerateLimit = async (userId: string): Promise<Limit> => {
  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/limit/exam/${userId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    },
  );

  const data: Limit = await response.json();
  return data;
};
