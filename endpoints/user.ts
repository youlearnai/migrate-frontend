import { createSession, deleteSession } from "@/app/actions/auth";
import { customFetch } from "@/lib/custom-fetch";
import {
  CompleteUserProfile,
  Content,
  FlashcardsDailyReviewLimit,
  FlashcardsLearningSteps,
  GetUserSummaryPromptsResponse,
  History,
  QuestionType,
  QuizDifficulty,
  Space,
  SummaryPreference,
  Tier,
  UserData,
  UserSignUpProps,
  UserSummaryPrompt,
  UserUpgradeLimitFirstReachedTime,
} from "@/lib/types";

export async function authSignUp(
  userData: UserSignUpProps,
  idToken: string,
  statusCodes?: number[],
) {
  try {
    const headers = {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    };

    const response = await customFetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/signup`,
      {
        method: "POST",
        headers,
        cache: "no-store",
        body: JSON.stringify(userData),
        credentials: "include",
      },
      true,
      statusCodes,
    );

    // Set cookie only after successful backend call
    await createSession(idToken);

    return await response.json();
  } catch (error) {
    console.error("Error in userSignup:", error);
    throw error;
  }
}

export async function authSignIn(
  userId: string,
  idToken: string,
  statusCodes?: number[],
) {
  try {
    const data = {
      user_id: userId,
    };

    const headers = {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    };

    const response = await customFetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/signin`,
      {
        method: "POST",
        headers,
        cache: "no-store",
        body: JSON.stringify(data),
        credentials: "include",
      },
      true,
      statusCodes,
    );

    // Set cookie only after successful backend call
    await createSession(idToken);

    return await response.json();
  } catch (error) {
    console.error("Error in userSignin:", error);
    throw error;
  }
}

export const getUser = async (userId: string): Promise<UserData | null> => {
  try {
    const response = await customFetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/${userId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      },
    );

    const data: UserData = await response.json();
    return data;
  } catch (err) {
    return null;
  }
};

export const getUserProfile = async (
  userId: string,
): Promise<CompleteUserProfile | null> => {
  try {
    const response = await customFetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/${userId}/profile`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: userId === "anonymous" ? "omit" : "include",
      },
    );

    const data: CompleteUserProfile = await response.json();
    return data;
  } catch (err) {
    return null;
  }
};

export const updateUser = async (
  userId: string,
  educationLevel: string | null,
  photoURL: string,
  language: string,
  interests: string[],
  chatModelId: string,
  fullName: string,
  summaryPreference: SummaryPreference,
  customSummary?: string,
  purpose?: string,
  purpose_detail?: string,
  referral_source?: string,
  other_referral_source?: string,
): Promise<UserData[] | null> => {
  try {
    const userData = {
      education_level: educationLevel,
      photo_url: photoURL,
      language: language,
      interests: interests,
      chat_model_id: chatModelId,
      full_name: fullName,
      summary_preference: summaryPreference,
      user_summary_prompt: customSummary,
      purpose: purpose,
      purpose_detail: purpose_detail,
      referral_source: referral_source,
      other_referral_source: other_referral_source,
    };

    const response = await customFetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/${userId}/`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
        credentials: "include",
      },
    );

    const data: UserData[] = await response.json();
    return data;
  } catch (err) {
    return null;
  }
};

export const getLanding = async (
  userId: string,
  number: number,
  cookieHeader?: string,
): Promise<Content[] | null> => {
  try {
    const response = await customFetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/content/landing?n=${number}&user_id=${userId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
        credentials: userId === "anonymous" ? "omit" : "include",
      },
    );

    const data: Content[] = await response.json();
    return data;
  } catch (err) {
    return null;
  }
};

export const getHistory = async (
  userId: string,
  page: number,
  pageSize: number,
  cookieHeader?: string,
): Promise<{
  content_history: History[];
  content_history_page_count: number;
} | null> => {
  try {
    const response = await customFetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/${userId}/content/history/${page}/${pageSize}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
        credentials: userId === "anonymous" ? "omit" : "include",
      },
    );

    const data = await response.json();
    return {
      content_history: data.content_history,
      content_history_page_count: data.content_history_page_count,
    };
  } catch (err) {
    return null;
  }
};

export async function authLogOut(userId: string) {
  try {
    const data = {
      user_id: userId,
    };

    const headers = {
      "Content-Type": "application/json",
    };

    const response = await customFetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/logout`,
      {
        method: "POST",
        headers,
        cache: "no-store",
        body: JSON.stringify(data),
        credentials: "include",
      },
    );

    // Delete cookie only after successful backend call
    await deleteSession();

    return await response.json();
  } catch (error) {
    console.error("Error in userSignin:", error);
    throw error;
  }
}

export const contact = async (
  userId?: string,
  name?: string,
  email?: string,
  message?: string,
  feedback_type?: string | undefined,
  imageUrls?: string[],
) => {
  const userData = {
    user_id: userId,
    name: name,
    email: email,
    form_type: "feedback",
    message: message,
    metadata: { feedback_type: feedback_type, image_urls: imageUrls },
  };
  try {
    const response = await customFetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/feedback/submit`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
        credentials: "include",
      },
    );

    const data = await response.json();
    return data;
  } catch (err) {
    return null;
  }
};

export const checkout = async (
  userId: string,
  priceId: string,
  country: string,
  tier: Tier,
  path?: string,
): Promise<{ url: string } | null> => {
  const userData = {
    user_id: userId,
    price_id: priceId,
    country: country,
    tier: tier,
    path: path,
  };

  try {
    const response = await customFetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/payment/checkout`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
        credentials: "include",
      },
    );

    const data: { url: string } = await response.json();

    if (data.url) {
      return data;
    } else {
      throw new Error("Invalid response: URL not found");
    }
  } catch (err) {
    console.error(err);
    return null;
  }
};

export const getUserSpaces = async (
  userId: string,
  cookieHeader?: string,
): Promise<{ space: Space; content_count: number }[] | null> => {
  try {
    const response = await customFetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/${userId}/spaces`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
        credentials: "include",
      },
    );

    const data: { space: Space; content_count: number }[] =
      await response.json();

    return data;
  } catch (err) {
    return null;
  }
};

export const getPortal = async (
  userId: string,
): Promise<{ url: string } | null> => {
  try {
    const response = await customFetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/payment/portal/${userId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      },
    );
    const data: { url: string } = await response.json();
    return data;
  } catch (err) {
    return null;
  }
};

export async function deleteAccount(userId: string): Promise<boolean> {
  try {
    const data = {
      user_id: userId,
    };

    const headers = {
      "Content-Type": "application/json",
    };

    const response = await customFetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/${userId}/`,
      {
        method: "DELETE",
        headers,
        body: JSON.stringify(data),
        credentials: userId === "anonymous" ? "omit" : "include",
      },
      true,
      undefined,
      [409],
    );

    if (response.status === 204) {
      return true;
    }

    return true;
  } catch (error) {
    console.error("Error in userSignin:", error);
    return false;
  }
}

export const getTier = async (
  userId: string,
): Promise<Tier | "anonymous" | null> => {
  try {
    const response = await customFetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/${userId}/tier`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: userId === "anonymous" ? "omit" : "include",
      },
    );

    const data: Tier | "anonymous" = await response.json();
    return data;
  } catch (err) {
    return null;
  }
};

export const getFeedback = async (
  userId: string,
  disappointmentLevel: string,
  wouldUseAlternative: boolean,
  primaryBenefit: string,
  hasRecommended: boolean,
  idealUserType: string,
  improvements: string,
  canFollowUp: boolean,
  recommendationDetails?: string,
  alternative?: string,
) => {
  const userData = {
    user: userId,
    disappointment_level: disappointmentLevel,
    would_use_alternative: wouldUseAlternative,
    alternative: alternative,
    primary_benefit: primaryBenefit,
    has_recommended: hasRecommended,
    recommendation_details: recommendationDetails,
    ideal_user_type: idealUserType,
    improvements: improvements,
    can_follow_up: canFollowUp,
  };

  try {
    const response = await customFetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/feedback/power`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
        credentials: "include",
      },
    );

    const data = await response.json();
    return data;
  } catch (err) {
    return null;
  }
};

export const getFeedbackVoice = async (
  userId: string,
  rating?: number,
  message?: string,
) => {
  const userData = {
    user_id: userId,
    message: message,
    rating: rating,
  };

  try {
    const response = await customFetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/feedback/voice/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
        credentials: "include",
      },
    );

    const data = await response.json();
    return data;
  } catch (err) {
    return null;
  }
};

export const getFeedbackFlashcard = async (
  userId: string,
  rating?: number,
  message?: string,
) => {
  const userData = {
    user_id: userId,
    message: message,
    rating: rating,
  };

  try {
    const response = await customFetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/feedback/flashcards/active_recall`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
        credentials: "include",
      },
    );

    const data = await response.json();
    return data;
  } catch (err) {
    return null;
  }
};

export const getUserPrompts = async (
  userId: string,
): Promise<GetUserSummaryPromptsResponse> => {
  const data = {
    user_id: userId,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/prompts`,
    {
      method: "POST",
      body: JSON.stringify(data),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return (await response.json()) as GetUserSummaryPromptsResponse;
};

export const createUserPrompt = async (
  userId: string,
  name: string,
  prompt: string,
  setDefault?: boolean,
): Promise<UserSummaryPrompt> => {
  const data = {
    user_id: userId,
    name: name,
    prompt: prompt,
    set_as_default: setDefault,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/prompts/create`,
    {
      method: "POST",
      body: JSON.stringify(data),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return (await response.json()) as UserSummaryPrompt;
};

export const getUserContentStudyGuidePreferences = async (
  userId: string,
  contentId: string,
): Promise<QuestionType[]> => {
  const data = {
    user_id: userId,
    content_id: contentId,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/preference/content/study_guide_question_types`,
    {
      method: "POST",
      body: JSON.stringify(data),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return (await response.json()) as QuestionType[];
};

export const updateUserContentStudyGuidePreferences = async (
  userId: string,
  contentId: string,
  questionTypes: QuestionType[],
) => {
  const data = {
    user_id: userId,
    content_id: contentId,
    preference: questionTypes,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/preference/content/study_guide_question_types`,
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

export const deleteSummaryPrompt = async (userId: string, promptId: string) => {
  const data = {
    user_id: userId,
    prompt_id: promptId,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/prompts/delete`,
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

export const cancelSubscriptionForm = async (
  userId: string,
  primaryReason: string,
  otherReason?: string,
  additionalFeedback?: string,
  switchingPlatformDetails?: string,
  dontUseEnoughDetails?: string,
  evaluatingDetails?: string,
  notUsefulDetails?: string,
  tooExpensiveDetails?: string,
): Promise<boolean> => {
  const data = {
    user: userId,
    primary_reason: primaryReason,
    other_reason: otherReason,
    additional_feedback: additionalFeedback,
    switching_platform_details: switchingPlatformDetails,
    dont_use_enough_details: dontUseEnoughDetails,
    evaluating_details: evaluatingDetails,
    not_useful_details: notUsefulDetails,
    too_expensive_details: tooExpensiveDetails,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/feedback/cancel`,
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

export const submitTeamPricingForm = async (
  userId: string,
  companyName: string,
  teamMembers: number,
  message: string,
): Promise<boolean> => {
  const data = {
    user: userId,
    company_name: companyName,
    team_members: teamMembers,
    message: message,
  };
  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/feedback/team_plan`,
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

export const pauseSubscription = async (
  userId: string,
  resumeOn?: string | null,
): Promise<any> => {
  const data = {
    resume_on: resumeOn,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/${userId}/subscriptions/pause`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      credentials: "include",
    },
  );

  return await response.json();
};

export const resumeSubscription = async (userId: string): Promise<any> => {
  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/${userId}/subscriptions/resume`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    },
  );

  return await response.json();
};

export const getUserContentStudyGuideDifficulty = async (
  userId: string,
  contentId: string,
): Promise<QuizDifficulty[]> => {
  const data = {
    user_id: userId,
    content_id: contentId,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/preference/content/quiz_difficulties`,
    {
      method: "POST",
      body: JSON.stringify(data),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return (await response.json()) as QuizDifficulty[];
};

export const updateUserContentStudyGuideDifficulty = async (
  userId: string,
  contentId: string,
  preferences: QuizDifficulty[],
) => {
  const data = {
    user_id: userId,
    content_id: contentId,
    preference: preferences,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/preference/content/quiz_difficulties`,
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

export const getFlashcardsDailyReviewLimit = async (
  userId: string,
): Promise<FlashcardsDailyReviewLimit> => {
  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/flashcards/daily_review_limit?user_id=${userId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: userId === "anonymous" ? "omit" : "include",
    },
  );

  const data: FlashcardsDailyReviewLimit = await response.json();
  return data;
};

export const updateFlashcardsDailyReviewLimit = async (
  userId: string,
  flashcardsDailyReviewLimit: number,
  contentId: string,
): Promise<boolean> => {
  const data = {
    user_id: userId,
    content_id: contentId,
    new_flashcards_limit: flashcardsDailyReviewLimit,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/preference/content/new_flashcards_limit`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      credentials: userId === "anonymous" ? "omit" : "include",
    },
  );

  if (response.status === 204) {
    return true;
  }

  return false;
};

export const getFlashcardsLearningSteps = async (
  userId: string,
  contentId: string,
): Promise<FlashcardsLearningSteps> => {
  const data = {
    user_id: userId,
    content_id: contentId,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/preference/content/learning_steps`,
    {
      method: "POST",
      body: JSON.stringify(data),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  const result = await response.json();
  return result as FlashcardsLearningSteps;
};

export const updateFlashcardsLearningSteps = async (
  userId: string,
  contentId: string,
  learningSteps: number[],
): Promise<boolean> => {
  const data = {
    user_id: userId,
    content_id: contentId,
    learning_steps: learningSteps,
  };

  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/preference/content/learning_steps`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      credentials: userId === "anonymous" ? "omit" : "include",
    },
  );

  if (response.status === 204) {
    return true;
  }

  return false;
};

export const getUserIsNew = async (userId: string): Promise<boolean> => {
  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/${userId}/is_new`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: userId === "anonymous" ? "omit" : "include",
    },
  );

  return (await response.json()) as boolean;
};

export const getUserUpgradeLimitFirstReachedTime = async (
  userId: string,
): Promise<UserUpgradeLimitFirstReachedTime> => {
  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/${userId}/upgrade_limit_first_reached`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: userId === "anonymous" ? "omit" : "include",
    },
  );

  const res = await response.json();
  if (res?.upgrade_limit_first_reached_at) {
    const originalTime = new Date(res.upgrade_limit_first_reached_at);
    const timeWith10Minutes = new Date(originalTime.getTime() + 10 * 60 * 1000);

    return {
      upgrade_limit_first_reached_at: timeWith10Minutes,
    };
  }
  return res as UserUpgradeLimitFirstReachedTime;
};

export const getServerVersion = async (): Promise<{
  VERCEL_DEPLOYMENT_ID: string;
}> => {
  const response = await fetch("/api/server-version?dpl=LATEST");

  return (await response.json()) as {
    VERCEL_DEPLOYMENT_ID: string;
  };
};
