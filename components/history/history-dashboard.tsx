"use client";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useGetHistory } from "@/query-hooks/user";
import ContentCard from "../global/content-card";
import ContentCardSkeleton from "../skeleton/content-card-skeleton";
import BoardPagination from "../global/board-pagination";
import { useTranslation } from "react-i18next";
import { Box } from "lucide-react";

export default function HistoryDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const itemsPerPage = 12;
  const currentPage = Number(searchParams.get("page") || 1);
  const {
    data: histories,
    isLoading,
    error,
  } = useGetHistory(currentPage, itemsPerPage);

  if (error) {
    console.error("History fetch error:", error);
    return <div>Error loading history</div>;
  }

  const handlePageChange = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    router.push(`?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 md:gap-8 2xl:grid-cols-4 lg:grid-cols-3 sm:grid-cols-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div className="max-w-sm">
            <ContentCardSkeleton key={index} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="my-8 px-4 sm:px-0">
      <div className="grid gap-4 sm:gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {histories?.content_history.map((history, index) => (
          <Link
            key={index}
            href={
              history.space
                ? `/learn/space/${history.space.id}/content/${history.content.content_id}`
                : `/learn/content/${history.content.content_id}`
            }
            className="flex flex-col max-w-sm justify-between shadow-[0_4px_10px_rgba(0,0,0,0.02)] hover:dark:border-neutral-700/40 bg-white dark:bg-neutral-800/50 cursor-pointer transition-all duration-200 rounded-2xl border group"
          >
            <ContentCard
              priority={index <= 3}
              className="hover:shadow-none w-full hover:dark:shadow-none drop-shadow-none"
              {...history.content}
              spaceId={history.space?.id}
              indicator={
                history?.space && (
                  <div className="absolute bottom-2 left-2 bg-primary/50 backdrop-blur-sm text-primary-foreground px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <Box className="w-3 h-3" />
                    <span className="max-w-[8rem] truncate">
                      {history.space.name}
                    </span>
                  </div>
                )
              }
            />
          </Link>
        ))}
      </div>
      {histories?.content_history.length === 0 && (
        <div className="flex w-full mt-12 px-10 flex-col items-center justify-center max-w-sm">
          <div className="flex flex-row">
            <h1 className="text-2xl text-center mr-1 md:hidden block">
              {t("historyDashboard.loadingPlaceholder")}
            </h1>
            <h1 className="text-2xl text-center mr-1 md:block hidden">
              {t("historyDashboard.loadingDetailed")}
            </h1>
          </div>
          <h2 className="mt-4 text-neutral-500 text-center md:hidden block">
            {t("historyDashboard.noHistoryMessageShort")}
          </h2>
          <h2 className="mt-4 text-neutral-500 text-center text-wrap px-8 md:block hidden">
            {t("historyDashboard.noHistoryMessageLong")}
          </h2>
        </div>
      )}
      <div className="hidden">
        Debug: Has histories: {histories ? "yes" : "no"}, Page count:{" "}
        {histories?.content_history_page_count}, Current page: {currentPage}
      </div>
      {(() => {
        const totalPages = (histories?.content_history_page_count ?? 0) + 1;

        return totalPages > 1 ? (
          <div className="my-8">
            <BoardPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        ) : null;
      })()}
    </div>
  );
}
