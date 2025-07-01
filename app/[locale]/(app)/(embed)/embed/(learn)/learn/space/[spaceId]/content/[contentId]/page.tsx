import LearnContentEmbed from "@/components/embed/learn-content-embed";
import { getContent } from "@/endpoints/content";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getAuthData } from "@/app/actions/auth";

const LearnContentPage = async (props: {
  params: Promise<{ contentId: string; spaceId: string }>;
}) => {
  const params = await props.params;
  const { queryClient, cookieHeader, decodedToken } = await getAuthData();

  try {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ["getContent", params.contentId, params.spaceId],
        queryFn: () =>
          getContent(
            decodedToken?.uid || "anonymous",
            params.contentId,
            params.spaceId,
            true,
            cookieHeader,
          ),
      }),
    ]);
  } catch (error) {
    console.error("RSC Error: ", error);
  }

  return (
    <HydrationBoundary
      key="learn-space-hydration"
      state={dehydrate(queryClient)}
    >
      <LearnContentEmbed key="learn-space-page" />
    </HydrationBoundary>
  );
};

export default LearnContentPage;
