import { getLocation, getPrice } from "@/endpoints/price";
import useAuth from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";

export const useGetPrice = (country: string) => {
  const { user, loading } = useAuth();

  return useQuery({
    queryKey: ["getPrice"],
    queryFn: () => getPrice(user?.uid!, country),
    enabled: !!country && !loading,
    staleTime: 0,
  });
};

export const useGetLocation = () => {
  return useQuery({
    queryKey: ["getLocation"],
    queryFn: getLocation,
    staleTime: 1000 * 60 * 60 * 24 * 3, // 3 days
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
    refetchInterval: 1000 * 60 * 60 * 24 * 3, // 3 days
    refetchIntervalInBackground: false,
  });
};
