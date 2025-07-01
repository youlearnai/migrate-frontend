import {
  getAddContentLimit,
  getAgentChatLimit,
  getExamGenerateLimit,
  getPricingLimit,
  getStudyGuideLimit,
  getSummaryLimit,
  getTotalChatLimit,
  getVoiceChatLimit,
} from "@/endpoints/limit";
import useAuth from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";

export const useAgenticChatLimit = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["agenticChatLimit", user?.uid || "anonymous"],
    queryFn: () => getAgentChatLimit(user?.uid || "anonymous"),
    enabled: !!user,
  });
};

export const useTotalChatLimit = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["totalChatLimit", user?.uid || "anonymous"],
    queryFn: () => getTotalChatLimit(user?.uid || "anonymous"),
    enabled: !!user,
  });
};

export const useVoiceChatLimit = (enabled: boolean = true) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["voiceChatLimit"],
    queryFn: () => getVoiceChatLimit(user?.uid || "anonymous"),
    enabled: !!user && enabled,
  });
};

export const usePricingLimit = () => {
  const { user, loading } = useAuth();

  return useQuery({
    queryKey: ["pricingLimit", user?.uid || "anonymous"],
    queryFn: () => getPricingLimit(user?.uid || "anonymous"),
    enabled: !loading,
  });
};

export const useSummaryLimit = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["summaryLimit", user?.uid || "anonymous"],
    queryFn: () => getSummaryLimit(user?.uid || "anonymous"),
    enabled: !!user,
  });
};

export const useStudyGuideLimit = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["studyGuideLimit", user?.uid || "anonymous"],
    queryFn: () => getStudyGuideLimit(user?.uid || "anonymous"),
    enabled: !!user,
  });
};

export const useAddContentLimit = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["addContentLimit", user?.uid || "anonymous"],
    queryFn: () => getAddContentLimit(user?.uid || "anonymous"),
    enabled: !!user,
  });
};

export const useExamGenerateLimit = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["examGenerateLimit", user?.uid || "anonymous"],
    queryFn: () => getExamGenerateLimit(user?.uid || "anonymous"),
    enabled: !!user,
  });
};
