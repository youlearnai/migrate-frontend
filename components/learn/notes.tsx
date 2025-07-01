import useAuth from "@/hooks/use-auth";
import { useGetNotes } from "@/query-hooks/content";
import { DefaultBlockSchema, PartialBlock } from "@blocknote/core";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import AuthRequired from "../auth/auth-required";

export const Editor = dynamic(() => import("./editor"), { ssr: false });

export default function Notes() {
  const params = useParams();
  const contentId = params.contentId as string;
  const { data: data, isLoading, isRefetching } = useGetNotes(contentId);
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const pathname = usePathname();

  if (isLoading || loading) return <Skeleton className="h-[500px] w-full" />;

  if (!user)
    return (
      <div className="mt-4 px-4 sm:px-0">
        <AuthRequired message={t("notes.pleaseLoginToViewNotes")} />
      </div>
    );

  return (
    <Editor
      key={data?.note?.length}
      notes={data?.note as PartialBlock<DefaultBlockSchema>[]}
    />
  );
}
