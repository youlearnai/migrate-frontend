import SpaceBoard from "@/components/space/space-board";
import SpaceHeader from "@/components/space/space-header";
import { getSpace, getSpaceSeo } from "@/endpoints/space";
import i18nConfig from "@/i18nConfig";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getAuthData } from "@/app/actions/auth";
import { getAppBaseUrl } from "@/lib/domains";

export const generateMetadata = async (props: {
  params: Promise<{ spaceId: string }>;
}) => {
  const params = await props.params;
  const seo = await getSpaceSeo(await params.spaceId);

  return {
    title: seo.title,
    description: seo.description,
    image: seo.image,
    metadataBase: new URL(getAppBaseUrl()),
    alternates: {
      canonical: `${getAppBaseUrl()}/space/${params.spaceId}`,
      languages: Object.fromEntries(
        i18nConfig.locales.map((locale) => [
          locale,
          `${getAppBaseUrl()}/${locale}/space/${params.spaceId}`,
        ]),
      ),
    },
    openGraph: {
      type: "website",
      siteName: "YouLearn AI",
      title: seo.title,
      description: seo.description,
      url: `${getAppBaseUrl()}/space/${params.spaceId}`,
      locale: "en_US",
      images: [
        {
          url: seo.image,
          width: 1200,
          height: 630,
          alt: "YouLearn AI - Space Preview",
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

const Space = async (props: { params: Promise<{ spaceId: string }> }) => {
  const params = await props.params;
  const { queryClient, cookieHeader, decodedToken } = await getAuthData();

  try {
    await queryClient.prefetchQuery({
      queryKey: ["getSpace", decodedToken?.uid || "anonymous", params.spaceId],
      queryFn: () =>
        getSpace(
          decodedToken?.uid || "anonymous",
          params.spaceId,
          cookieHeader,
        ),
    });
  } catch (error) {
    console.error("RSC Error: ", error);
  }

  return (
    <div className="flex flex-col w-full items-center justify-center">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <SpaceHeader />
        <SpaceBoard />
      </HydrationBoundary>
    </div>
  );
};

export default Space;
