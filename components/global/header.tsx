"use client";
import { Skeleton } from "@/components/ui/skeleton";
import useAuth from "@/hooks/use-auth";
import { useLeftSidebar } from "@/hooks/use-left-sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import ContentTitle from "./content-title";
import LanguageDropdown from "./language-dropdown";
import { LeftSidebar } from "./left-sidebar";
import Logo from "./logo";
import { RightSidebar } from "./right-sidebar";
import ShareButton from "./share-button";
import { SheetMenu } from "./sheet-menu";
import UpgradeButton from "./upgrade-button";
import VoiceButton from "./voice-button";
import SourceBackButton from "./source-back-button";
import SearchButton from "./search-button";
import AdvancedVoiceModeButton from "./advanced-voice-mode-button";

const Header: React.FC = () => {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const isLearnPage = pathname.includes("/learn");
  const { t } = useTranslation();
  const { isOpen } = useLeftSidebar();
  const isExamPage = pathname.includes("/exam");
  const isPersonalFormPage = pathname.includes("/personal-form");
  if (isExamPage || isPersonalFormPage) return null;

  const signInLink = `/signin${!pathname.includes("reset-password") ? `?returnUrl=${encodeURIComponent(pathname)}` : ""}`;

  const renderButtons = () => {
    const showUpgradeButton = !pathname.includes("sign") && user;

    return (
      <div className="flex items-center flex-row space-x-2">
        {user && isLearnPage && <SourceBackButton />}
        {showUpgradeButton && <UpgradeButton />}
        {!pathname.includes("sign") && <LanguageDropdown />}
        {/* {user && isLearnPage && (
          <>
            <VoiceButton />
            <AdvancedVoiceModeButton />
          </>
        )} */}
        {user && <SearchButton />}
        {user && (isLearnPage || pathname.includes("space")) && <ShareButton />}
        {!user && (
          <Link href={signInLink}>
            <Button
              variant="outline"
              className="bg-primary text-secondary hover:bg-primary/90 hover:text-secondary/90"
            >
              {t("header.signIn")}
            </Button>
          </Link>
        )}
      </div>
    );
  };

  return (
    <header
      className={`sticky top-0 ${isOpen ? "lg:left-64 left-0" : "left-0 md:left-2"} right-0 bg-background z-50 transition-all duration-300`}
    >
      <div className="mx-auto px-2 lg:px-6">
        <div className="lg:hidden py-2">
          <div className="flex gap-2 justify-between items-center">
            <SheetMenu />
            {user && <Logo size="lg" />}
            <div className="ml-auto">{renderButtons()}</div>
          </div>
        </div>
        <div className="hidden lg:flex lg:flex-col py-4">
          <div className="flex justify-between items-center relative">
            <div className="flex items-center space-x-0 min-w-0 flex-1">
              <LeftSidebar />
              {isLearnPage && <ContentTitle />}
            </div>
            <div className="flex-shrink-0">{renderButtons()}</div>
          </div>
        </div>
        <div className="hidden xl:flex">
          <RightSidebar />
        </div>
      </div>
    </header>
  );
};

export default Header;
