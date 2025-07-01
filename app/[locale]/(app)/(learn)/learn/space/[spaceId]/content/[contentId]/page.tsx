import Learn from "@/components/learn/learn";
import { getContent, getContentSeo } from "@/endpoints/content";
import i18nConfig from "@/i18nConfig";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getAuthData } from "@/app/actions/auth";
import { getAppBaseUrl } from "@/lib/domains";

export const generateMetadata = async (props: {
  params: Promise<{ contentId: string; spaceId: string }>;
}) => {
  const params = await props.params;
  const { decodedToken } = await getAuthData();
  const seo = await getContentSeo(
    decodedToken?.uid || "anonymous",
    await params.contentId,
  );

  return {
    title: seo.title,
    description: seo.description,
    image: seo.image,
    metadataBase: new URL(getAppBaseUrl()),
    alternates: {
      canonical: `${getAppBaseUrl()}/learn/space/${params.spaceId}/content/${params.contentId}`,
      languages: Object.fromEntries(
        i18nConfig.locales.map((locale) => [
          locale,
          `${getAppBaseUrl()}/${locale}/learn/space/${params.spaceId}/content/${params.contentId}`,
        ]),
      ),
    },
    openGraph: {
      type: "website",
      siteName: "YouLearn AI",
      title: seo.title,
      description: seo.description,
      url: `${getAppBaseUrl()}/learn/space/${params.spaceId}/content/${params.contentId}`,
      locale: "en_US",
      images: [
        {
          url: seo.image,
          width: 1200,
          height: 630,
          alt: "YouLearn AI - Space Content Preview",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: [seo.image || "/opengraph-image.png"],
      creator: "@youlearn",
      site: "@youlearn",
    },
  };
};

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
      <Learn key="learn-space-page" />
    </HydrationBoundary>
  );
};

export default LearnContentPage;
