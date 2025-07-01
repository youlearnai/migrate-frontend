import { useMutation } from "@tanstack/react-query";
import { checkTTSCache, storeTTSCache } from "@/endpoints/utils";
import useAuth from "@/hooks/use-auth";

export const useCheckTTSCache = () => {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ hash }: { hash: string }) => {
      return checkTTSCache(user?.uid as string, hash);
    },
    mutationKey: ["checkTTSCache"],
  });
};

export const useStoreTTSCache = () => {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({
      hash,
      audioUrl,
    }: {
      hash: string;
      audioUrl: string;
    }) => {
      return storeTTSCache(user?.uid as string, hash, audioUrl);
    },
    mutationKey: ["storeTTSCache"],
  });
};
