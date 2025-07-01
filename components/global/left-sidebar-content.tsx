"use client";
import Account from "@/components/global/account";
import useAuth from "@/hooks/use-auth";
import { History, Plus, ChevronDown, ArrowDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import LeftSidebarHelpTools from "./left-sidebar-help-tools";
import SidebarRecents from "./left-sidebar-recents";
import SidebarSpaces from "./left-sidebar-spaces";
import { NewFeatureCards } from "./new-feature-cards";
import { useNewFeatureStore } from "@/hooks/use-new-feature-store";
import { useLocalStorage } from "usehooks-ts";
import { PlanUsageCompact } from "./plan-usage-compact";
import { useUser } from "@/query-hooks/user";

export const LeftSidebarContent = React.memo(function LeftSidebarContent() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { data: backendUser } = useUser();
  const { t } = useTranslation();
  const { getActiveFeatures } = useNewFeatureStore();
  const activeFeatures = getActiveFeatures();
  const [showNewButton, setShowNewButton] = useLocalStorage(
    "showNewButton",
    true,
  );

  const { ref: newFeatureCardsRef, inView: isNewFeatureCardsVisible } =
    useInView({
      threshold: 0.1,
      rootMargin: "0px 0px 0px 0px",
    });

  const signInLink = `/signin${!pathname.includes("reset-password") ? `?returnUrl=${encodeURIComponent(pathname)}` : ""}`;

  const scrollToNewFeatureCards = () => {
    const element = document.querySelector("[data-new-feature-cards]");
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  if (loading) {
    return (
      <nav className="h-full w-full">
        <ul
          className={`flex flex-col h-full ${activeFeatures.length >= 0 && backendUser?.user_group?.group === "show_usage_061925" ? "min-h-[calc(120vh)]" : "min-h-[calc(80vh)]"} items-start space-y-6 px-2`}
        >
          <li className="w-full">
            <Skeleton className="h-10 w-full rounded-md" />
          </li>
          {[0, 1, 2].map((i) => (
            <li key={i} className="w-full">
              <Skeleton className="h-6 w-full rounded-md" />
              {[0, 1, 2, 3].map((j) => (
                <Skeleton key={j} className="h-9 w-full mt-2" />
              ))}
            </li>
          ))}
        </ul>
      </nav>
    );
  }

  return (
    <nav className="h-full w-full">
      <ul
        className={`flex flex-col h-full ${activeFeatures.length >= 0 && backendUser?.user_group?.group === "show_usage_061925" ? "min-h-[calc(120vh)]" : "min-h-[calc(80vh)]"} items-start space-y-6 px-2`}
      >
        <li className="w-full">
          <Link href="/">
            <Button
              className={`w-full flex border-2 border-dashed border-primary/10 justify-start items-center p-2 h-fit truncate text-primary/80 hover:text-primary hover:bg-primary/5 hover:border-primary/10 underline-none text-left ${
                pathname === "/"
                  ? "bg-primary/5 text-primary"
                  : "bg-transparent"
              }`}
              size="sm"
              variant="plain"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span>{t("addContent.addContentButton")}</span>
            </Button>
          </Link>
        </li>
        {!user && (
          <li className="w-full">
            <div className="mb-4 flex flex-col space-y-4 px-1 py-6">
              <h2 className="text-md font-medium">{t("homeWelcome.title")}</h2>
              <p className="text-sm text-primary/70">
                {t("homeWelcome.message1")}
              </p>
              <p className="text-sm text-primary/70">
                {t("homeWelcome.message2")}
              </p>
              <p className="text-sm text-primary/70">
                {t("homeWelcome.message3")}
              </p>
            </div>
          </li>
        )}
        {user && (
          <>
            <li className="w-full">
              <Link href="/history">
                <Button
                  className={`w-full flex justify-start hover:bg-primary/5 items-center p-2 h-fit truncate text-primary/80 ${
                    pathname === "/history" && "bg-primary/5 text-primary"
                  }`}
                  size="sm"
                  variant="plain"
                >
                  <History className="h-4 w-4 mr-2" />
                  <span>{t("accountMenu.history")}</span>
                </Button>
              </Link>
            </li>
            <li>
              <p className="ml-2 text-sm mb-2 font-semibold">
                {t("sidebar_recents")}
              </p>
              <SidebarRecents />
            </li>
            <li>
              <p className="ml-2 text-sm mb-2 font-semibold">
                {t("sidebar.spaces")}
              </p>
              <SidebarSpaces />
            </li>
            <li>
              <p className="ml-2 text-sm mb-2 font-semibold">
                {t("sidebar.helpTools")}
              </p>
              <LeftSidebarHelpTools />
            </li>
            {user && !loading && (
              <li
                ref={newFeatureCardsRef}
                className="w-full grow"
                data-new-feature-cards
              >
                <NewFeatureCards />
              </li>
            )}
            <li className="fixed bottom-2 left-3 w-[232px] grow flex items-end z-[1000]">
              <div className="flex w-full mb-2 flex-col space-y-2">
                {user &&
                  backendUser?.user_group?.group === "show_usage_061925" &&
                  !loading && (
                    <li className="w-full mb-0">
                      <PlanUsageCompact />
                    </li>
                  )}
                <Account />
              </div>
            </li>
            {/* {user &&
              !loading &&
              showNewButton &&
              !isNewFeatureCardsVisible &&
              getActiveFeatures().length > 0 && (
                <li className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50">
                  <Button
                    onClick={() => {
                      scrollToNewFeatureCards();
                      setShowNewButton(false);
                    }}
                    variant="outline"
                    className="relative flex items-center h-auto w-auto px-2 py-1.5 gap-1 bg-green-500/20 text-green-700 border-green-500/40 border dark:bg-green-600/25 dark:text-green-200 dark:border-green-400/50 hover:bg-green-500/30 hover:text-green-800 hover:border-green-500/60 dark:hover:bg-green-500/35 dark:hover:text-green-100 dark:hover:border-green-400/70 backdrop-blur-sm shadow-md shadow-green-500/25 hover:shadow-lg hover:shadow-green-500/40 dark:shadow-green-400/20 dark:hover:shadow-green-400/35 rounded-full transition-all duration-200 "
                  >
                    <span className="text-xs rounded-full font-semibold tracking-wide uppercase">
                      {t("new")}
                    </span>
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </li>
              )} */}
          </>
        )}
        {!user && (
          <li className="fixed bottom-2 left-3 w-[232px] grow flex items-end">
            <div className="mb-4 flex items-center flex-col space-y-3 justify-end w-full px-2 py-2">
              <p className="text-sm text-center text-primary/60">
                {t("upgrade.signInError")}
              </p>
              <Link className="w-full" href={signInLink}>
                <Button className="w-full" size="sm">
                  {t("accountMenu.signIn")}
                </Button>
              </Link>
            </div>
          </li>
        )}
      </ul>
    </nav>
  );
});
