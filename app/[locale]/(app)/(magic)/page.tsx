import Recents from "@/components/home/recents";
import RecommendedContent from "@/components/home/recommended-content";
import Spaces from "@/components/home/spaces";
import { getUserSpaces } from "@/endpoints/user";
import { getHistory, getLanding } from "@/endpoints/user";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getAuthData } from "@/app/actions/auth";

export default async function Home(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const { queryClient, cookieHeader, decodedToken } = await getAuthData();

  try {
    if (decodedToken) {
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: ["userSpaces", decodedToken?.uid],
          queryFn: () => getUserSpaces(decodedToken?.uid!, cookieHeader),
        }),
        queryClient.prefetchQuery({
          queryKey: ["getHistory", decodedToken?.uid, 1],
          queryFn: () => getHistory(decodedToken?.uid!, 1, 20, cookieHeader),
        }),
      ]);
    }

    await queryClient.prefetchQuery({
      queryKey: [
        "getLanding",
        decodedToken ? decodedToken?.uid : "anonymous",
        20,
      ],
      queryFn: () => getLanding(decodedToken?.uid!, 20, cookieHeader),
    });
  } catch (error) {
    console.error("RSC Error: ", error);
  }

  return (
    <div className="sm:px-10 lg:px-24 xl:px-36 mt-8 w-full">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Spaces />
        <Recents />
        <RecommendedContent />
      </HydrationBoundary>
    </div>
  );
}
