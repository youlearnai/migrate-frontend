import { generateReferralCode, getReferralCode } from "@/endpoints/referral";
import useAuth from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useGetReferralCode = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["referralCode", user?.uid || "anonymous"],
    queryFn: () => getReferralCode(user?.uid || "anonymous"),
    enabled: !!user?.uid,
  });
};

export const useGenerateReferralCode = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => generateReferralCode(user?.uid || "anonymous"),
    mutationKey: ["generateReferralCode", user?.uid || "anonymous"],
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["referralCode"] });
    },
  });
};
