import { getAuthData } from "@/app/actions/auth";
import HistoryDashboard from "@/components/history/history-dashboard";
import { getHistory } from "@/endpoints/user";
import initTranslations from "@/lib/i18n";
import { HydrationBoundary } from "@tanstack/react-query";
import { dehydrate } from "@tanstack/react-query";

const HistoryPage = async (props: { params: Promise<{ locale: string }> }) => {
  const params = await props.params;
  const { t } = await initTranslations(params.locale, ["default"]);
  const { queryClient, cookieHeader, decodedToken } = await getAuthData();

  try {
    await queryClient.prefetchQuery({
      queryKey: ["getHistory", decodedToken?.uid, 1],
      queryFn: () => getHistory(decodedToken?.uid!, 1, 12, cookieHeader),
    });
  } catch (error) {
    console.error("RSC Error: ", error);
  }

  return (
    <main className="sm:mx-4">
      <div className="md:mt-12 mt-8">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="text-xl md:text-2xl lg:text-3xl flex flex-row group w-[80%]">
            {t("history.title")}
          </div>
        </div>
      </div>
      <div className="border-[.5px] my-4" />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <HistoryDashboard />
      </HydrationBoundary>
    </main>
  );
};

export default HistoryPage;
