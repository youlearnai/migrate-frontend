"use client";
import { useEffect, use } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/use-auth";
import { useAddContent } from "@/query-hooks/content";
import Loading from "@/app/[locale]/loading";
import { useTranslation } from "react-i18next";

export default function AddContent(props: {
  params: Promise<{ url: string[]; locale: string }>;
}) {
  const params = use(props.params);
  const router = useRouter();
  const { loading } = useAuth();
  const { mutate: addContent } = useAddContent();
  const { t } = useTranslation();

  useEffect(() => {
    if (!loading) {
      const fullUrl = params.url.join("/");
      const decodedUrl = decodeURIComponent(fullUrl);

      addContent(
        {
          spaceId: undefined,
          contentURLs: [decodedUrl],
          addToHistory: true,
        },
        {
          onSuccess: (data) => {
            router.push(
              `/${params.locale}/learn/content/${data[0].content_id}`,
            );
          },
          onError: (error) => {
            console.error(t("addContent.errorLogging"), error);
            router.push(`/${params.locale}`);
          },
        },
      );
    }
  }, [loading, addContent, params.url, params.locale, router, t]);

  return <Loading />;
}
