import { upgradeModalEvent } from "@/endpoints/event";
import useAuth from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";

export const useUpgradeModalEvent = (
  path: string,
  options?: { enabled: boolean },
) => {
  const { user, loading } = useAuth();

  return useQuery({
    queryFn: async () =>
      await upgradeModalEvent(user?.uid!, user?.email!, path),
    queryKey: ["upgradeModalEvent", user?.uid!, user?.email!],
    enabled: !!user && !loading && options?.enabled,
    staleTime: 0,
    gcTime: 0,
  });
};
