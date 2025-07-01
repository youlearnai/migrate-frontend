import { TeamPricingFormData } from "@/components/modals/team-pricing-form-modal";
import {
  authLogOut,
  authSignIn,
  authSignUp,
  cancelSubscriptionForm,
  checkout,
  contact,
  createUserPrompt,
  deleteAccount,
  deleteSummaryPrompt,
  getFeedback,
  getFeedbackVoice,
  getFeedbackFlashcard,
  getFlashcardsDailyReviewLimit,
  getFlashcardsLearningSteps,
  getHistory,
  getLanding,
  getPortal,
  getTier,
  getUser,
  getUserContentStudyGuideDifficulty,
  getUserContentStudyGuidePreferences,
  getUserProfile,
  getUserPrompts,
  pauseSubscription,
  resumeSubscription,
  submitTeamPricingForm,
  updateFlashcardsDailyReviewLimit,
  updateFlashcardsLearningSteps,
  updateUser,
  updateUserContentStudyGuideDifficulty,
  updateUserContentStudyGuidePreferences,
  getUserIsNew,
  getUserUpgradeLimitFirstReachedTime,
  getServerVersion,
  getUserSpaces,
} from "@/endpoints/user";
import useAuth from "@/hooks/use-auth";
import {
  QuestionType,
  QuizDifficulty,
  SummaryPreference,
  Tier,
  UserSignUpProps,
} from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { flashcardsARawKey } from "./content";

export const useSignUp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userData,
      idToken,
      statusCodes,
    }: {
      userData: UserSignUpProps;
      idToken: string;
      statusCodes?: number[];
    }) => await authSignUp(userData, idToken, statusCodes),
    mutationKey: ["userSignUp"],
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
};

export const useSignIn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      idToken,
      statusCodes,
    }: {
      userId: string;
      idToken: string;
      statusCodes?: number[];
    }) => await authSignIn(userId, idToken, statusCodes),
    mutationKey: ["userSignIn"],
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
};

export const useLogOut = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => await authLogOut(user?.uid!),
    mutationKey: ["userLogOut"],
    onSuccess: () => {
      queryClient.invalidateQueries();
      queryClient.removeQueries();
    },
    retry: false,
  });
};

export const useUser = () => {
  const { user } = useAuth();

  return useQuery({
    queryFn: async () => await getUser(user?.uid!),
    queryKey: ["getUser", user?.uid],
    enabled: !!user,
  });
};

export const useUserProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryFn: async () => await getUserProfile(user ? user?.uid : "anonymous"),
    queryKey: ["getUserProfile", user ? user?.uid : "anonymous"],
    enabled: !!user,
  });
};

export const useUpdateUser = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      fullName,
      educationLevel,
      photoURL,
      language,
      interests,
      chatModelId,
      summaryPreference,
      customSummary,
      purpose,
      purposeDetail,
      referralSource,
      otherReferralSource,
    }: {
      fullName?: string;
      educationLevel?: string | null;
      photoURL?: string;
      language?: string;
      interests?: string[];
      chatModelId?: string;
      summaryPreference?: SummaryPreference;
      customSummary?: string;
      purpose?: string;
      purposeDetail?: string;
      referralSource?: string;
      otherReferralSource?: string;
    }) =>
      await updateUser(
        user?.uid!,
        educationLevel!,
        photoURL!,
        language!,
        interests!,
        chatModelId!,
        fullName!,
        summaryPreference!,
        customSummary!,
        purpose,
        purposeDetail,
        referralSource,
        otherReferralSource,
      ),
    mutationKey: ["updateUser"],
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["getUser", user?.uid],
      });
      queryClient.invalidateQueries({
        queryKey: ["getUserProfile", user?.uid],
      });
    },
  });
};

export const useGetLanding = (number = 4) => {
  const { user, loading } = useAuth();

  return useQuery({
    queryFn: async () =>
      await getLanding(user ? user?.uid : "anonymous", number),
    queryKey: ["getLanding", user ? user?.uid : "anonymous", number],
    enabled: !loading,
  });
};

export const useGetHistory = (page: number, pageSize: number) => {
  const { user } = useAuth();

  return useQuery({
    queryFn: async () => await getHistory(user?.uid!, page, pageSize),
    queryKey: ["getHistory", user?.uid, page],
    enabled: !!user,
  });
};

export const useContact = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (formValues: {
      name?: string;
      email?: string;
      message?: string;
      feedback_type?: string | undefined;
      imageUrls?: string[];
    }) => {
      const { name, email, message, feedback_type, imageUrls } = formValues;
      return await contact(
        name && email ? undefined : user?.uid,
        name,
        email,
        message,
        feedback_type,
        imageUrls,
      );
    },
  });
};

export const useCheckout = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formValues: {
      priceId: string;
      country: string;
      tier: Tier;
      path?: string;
    }) => {
      const { priceId, country, tier, path } = formValues;
      return await checkout(user?.uid!, priceId, country, tier, path);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["getUser", user?.uid],
      }),
  });
};

export const usePortalLink = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return await getPortal(user?.uid!);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["getUser", user?.uid],
      }),
  });
};

export const useDeleteAccount = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      return await deleteAccount(user ? user?.uid! : "anonymous");
    },
  });
};

export const useGetTier = () => {
  const { user, loading } = useAuth();

  return useQuery({
    queryFn: async () => await getTier(user ? user?.uid : "anonymous"),
    queryKey: ["getTier", user ? user?.uid : "anonymous"],
    enabled: !loading,
  });
};

export const useGetFeedback = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (formValues: {
      disappointmentLevel: string;
      wouldUseAlternative: boolean;
      primaryBenefit: string;
      hasRecommended: boolean;
      idealUserType: string;
      improvements: string;
      canFollowUp: boolean;
      recommendationDetails?: string;
      alternative?: string;
    }) => {
      const {
        disappointmentLevel,
        wouldUseAlternative,
        alternative,
        primaryBenefit,
        hasRecommended,
        recommendationDetails,
        idealUserType,
        improvements,
        canFollowUp,
      } = formValues;
      return await getFeedback(
        user?.uid ?? "anonymous",
        disappointmentLevel,
        wouldUseAlternative,
        primaryBenefit,
        hasRecommended,
        idealUserType,
        improvements,
        canFollowUp,
        recommendationDetails,
        alternative,
      );
    },
    mutationKey: ["getFeedback"],
  });
};

export const useGetFeedbackVoice = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (formValues: { score?: number; feedback?: string }) => {
      const { feedback, score } = formValues;
      return await getFeedbackVoice(user?.uid!, score, feedback);
    },
    mutationKey: ["getFeedbackVoice"],
  });
};

export const useGetFeedbackFlashcard = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (formValues: { score?: number; feedback?: string }) => {
      const { feedback, score } = formValues;
      return await getFeedbackFlashcard(user?.uid!, score, feedback);
    },
    mutationKey: ["getFeedbackFlashcard"],
  });
};

export const useGetUserPrompts = () => {
  const { user } = useAuth();

  return useQuery({
    queryFn: async () => await getUserPrompts(user?.uid!),
    queryKey: ["getUserPrompts", user?.uid],
    enabled: !!user,
  });
};

export const useCreateUserPrompt = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      prompt,
      setDefault,
    }: {
      name: string;
      prompt: string;
      setDefault?: boolean;
    }) => await createUserPrompt(user?.uid!, name, prompt, setDefault),
    mutationKey: ["createUserPrompt", user?.uid, name, prompt],
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["getUserPrompts", user?.uid],
      });
      queryClient.invalidateQueries({
        queryKey: ["getUserProfile", user?.uid],
      });
    },
  });
};

export const useGetUserContentStudyGuidePreferences = (contentId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryFn: async () =>
      await getUserContentStudyGuidePreferences(user?.uid!, contentId),
    queryKey: ["getUserContentStudyGuidePreferences", user?.uid, contentId],
    enabled: !!user,
  });
};

export const useUpdateUserContentStudyGuidePreferences = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contentId,
      questionTypes,
    }: {
      contentId: string;
      questionTypes: QuestionType[];
    }) =>
      await updateUserContentStudyGuidePreferences(
        user?.uid!,
        contentId,
        questionTypes,
      ),
    mutationKey: ["updateUserContentStudyGuidePreferences", user?.uid],
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "getUserContentStudyGuidePreferences",
          user?.uid,
          variables.contentId,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "getStudyGuideConceptProgress",
          user?.uid,
          variables.contentId,
        ],
      });
    },
  });
};

export const useDeleteSummaryPrompt = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ promptId }: { promptId: string }) =>
      await deleteSummaryPrompt(user?.uid!, promptId),
    mutationKey: ["deleteSummaryPrompt", user?.uid],
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["getUserPrompts", user?.uid],
      });
    },
  });
};

export const useCancelSubscriptionForm = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (formValues: {
      primaryReason: string;
      otherReason?: string;
      additionalFeedback?: string;
      switchingPlatformDetails?: string;
      dontUseEnoughDetails?: string;
      evaluatingDetails?: string;
      notUsefulDetails?: string;
      tooExpensiveDetails?: string;
    }) => {
      const {
        primaryReason,
        otherReason,
        additionalFeedback,
        switchingPlatformDetails,
        dontUseEnoughDetails,
        evaluatingDetails,
        notUsefulDetails,
        tooExpensiveDetails,
      } = formValues;
      return await cancelSubscriptionForm(
        user?.uid!,
        primaryReason,
        otherReason,
        additionalFeedback,
        switchingPlatformDetails,
        dontUseEnoughDetails,
        evaluatingDetails,
        notUsefulDetails,
        tooExpensiveDetails,
      );
    },
    mutationKey: ["cancelSubscriptionForm", user?.uid],
  });
};

export const useSubmitTeamPricingForm = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: TeamPricingFormData) =>
      await submitTeamPricingForm(
        user?.uid!,
        data.companyName,
        data.teamMembers,
        data.message,
      ),
    mutationKey: ["submitTeamPricingForm"],
  });
};

export const useUserSpaces = () => {
  const { user } = useAuth();

  return useQuery({
    queryFn: async () => await getUserSpaces(user?.uid!),
    queryKey: ["userSpaces", user?.uid],
    enabled: !!user,
  });
};

export const usePauseSubscription = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ resumeOn }: { resumeOn?: string | null } = {}) => {
      return await pauseSubscription(user?.uid!, resumeOn);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["getUser", user?.uid],
      });
      queryClient.invalidateQueries({
        queryKey: ["getTier"],
      });
    },
  });
};

export const useResumeSubscription = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return await resumeSubscription(user?.uid!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["getUser", user?.uid],
      });
      queryClient.invalidateQueries({
        queryKey: ["getTier"],
      });
    },
  });
};

export const useGetUserContentStudyGuideDifficulty = (contentId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryFn: async () =>
      await getUserContentStudyGuideDifficulty(user?.uid!, contentId),
    queryKey: ["getUserContentStudyGuideDifficulty", user?.uid, contentId],
    enabled: !!user,
  });
};

export const useUpdateUserContentStudyGuideDifficulty = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contentId,
      preferences,
    }: {
      contentId: string;
      preferences: QuizDifficulty[];
    }) =>
      await updateUserContentStudyGuideDifficulty(
        user?.uid!,
        contentId,
        preferences,
      ),
    mutationKey: ["updateUserContentStudyGuideDifficulty", user?.uid],
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "getUserContentStudyGuideDifficulty",
          user?.uid,
          variables.contentId,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "getStudyGuideConceptProgress",
          user?.uid,
          variables.contentId,
        ],
      });
    },
  });
};

export const useGetFlashcardsDailyReviewLimit = () => {
  const { user } = useAuth();

  return useQuery({
    queryFn: async () => await getFlashcardsDailyReviewLimit(user?.uid!),
    queryKey: ["getFlashcardsDailyReviewLimit", user?.uid],
    enabled: !!user,
  });
};

export const useUpdateFlashcardsDailyReviewLimit = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      flashcardsDailyReviewLimit,
      contentId,
    }: {
      flashcardsDailyReviewLimit: number;
      contentId: string;
    }) =>
      await updateFlashcardsDailyReviewLimit(
        user?.uid!,
        flashcardsDailyReviewLimit,
        contentId,
      ),
    mutationKey: ["updateFlashcardsDailyReviewLimit", user?.uid],
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: flashcardsARawKey(
          user?.uid ?? "anonymous",
          variables.contentId,
        ),
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

export const useGetFlashcardsLearningSteps = (contentId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryFn: async () =>
      await getFlashcardsLearningSteps(user?.uid!, contentId),
    queryKey: ["getFlashcardsLearningSteps", user?.uid, contentId],
    enabled: !!user && !!contentId,
  });
};

export const useUpdateFlashcardsLearningSteps = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contentId,
      learningSteps,
    }: {
      contentId: string;
      learningSteps: number[];
    }) =>
      await updateFlashcardsLearningSteps(user?.uid!, contentId, learningSteps),
    mutationKey: ["updateFlashcardsLearningSteps", user?.uid],
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: [
          "getFlashcardsLearningSteps",
          user?.uid!,
          variables.contentId,
        ],
      });
      await queryClient.invalidateQueries({
        queryKey: flashcardsARawKey(
          user?.uid ?? "anonymous",
          variables.contentId,
        ),
      });
    },
  });
};

export const useGetUserIsNew = () => {
  const { user, loading } = useAuth();

  return useQuery({
    queryFn: async () => await getUserIsNew(user ? user?.uid : "anonymous"),
    queryKey: ["getUserIsNew", user ? user?.uid : "anonymous"],
    enabled: !loading,
  });
};

export const useGetUserUpgradeLimitFirstReachedTime = ({
  enabled,
}: {
  enabled: boolean;
}) => {
  const { user } = useAuth();

  return useQuery({
    queryFn: async () =>
      await getUserUpgradeLimitFirstReachedTime(user ? user?.uid : "anonymous"),
    queryKey: [
      "getUserUpgradeLimitFirstReachedTime",
      user ? user?.uid : "anonymous",
    ],
    enabled: !!user && enabled,
    staleTime: 0,
  });
};

export const useSkewProtectionBusted = () => {
  const { data, error, isFetching } = useQuery({
    queryKey: ["skew-protection-buster_NOSTORE"],
    queryFn: async () => {
      return await getServerVersion();
    },
    // Check if version is outdated every 1 hour
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 1000 * 60 * 60,
  });

  if (isFetching || error || !data) return false;

  return (
    data.VERCEL_DEPLOYMENT_ID !== process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID
  );
};
