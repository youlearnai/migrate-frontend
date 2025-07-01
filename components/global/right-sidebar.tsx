"use client";
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";
import { ChevronsLeft, ChevronsRight, Maximize, Minimize } from "lucide-react";
import { memo, useState } from "react";
import RightSidebarContent from "./right-sidebar-content";
import { Button } from "../ui/button";
import { useLeftSidebar } from "@/hooks/use-left-sidebar";
import { useTranslation } from "react-i18next";

export const RightSidebar = memo(
  ({ children }: { children?: React.ReactNode }) => {
    const rightSidebar = useStore(useRightSidebar, (x) => x);
    const leftSidebar = useStore(useLeftSidebar, (x) => x);
    const [isHovering, setIsHovering] = useState(false);
    const { t } = useTranslation();
    if (!rightSidebar) return null;
    if (!leftSidebar) return null;
    const {
      toggleOpen,
      getOpenState,
      setIsHover,
      isFullWidth,
      setIsFullWidth,
    } = rightSidebar;
    const { getOpenState: getLeftOpenState } = leftSidebar;

    return (
      <>
        <aside
          className={cn(
            "fixed top-0 right-0 z-20 h-screen border-l bg-background -translate-x-full xl:translate-x-0 transition-all ease-in-out duration-300",
            getOpenState() && "w-[36rem]",
            getLeftOpenState() && isFullWidth && "w-[calc(100%-16rem)]",
            !getLeftOpenState() && isFullWidth && "w-full",
            !getOpenState() && "w-0",
          )}
        >
          {getOpenState() && (
            <div
              onMouseEnter={() => {
                setIsHover(true);
                setIsHovering(true);
              }}
              onMouseLeave={() => {
                setIsHover(false);
                setIsHovering(false);
              }}
              className="relative overflow-y-auto h-full flex flex-col px-1 py-4"
            >
              <div className="flex items-center justify-between ml-4 mr-2 mb-4">
                <div
                  className={cn(
                    "transition-opacity duration-300 ease-in-out mt-2",
                    isHovering ? "opacity-100" : "opacity-100 xl:opacity-0",
                  )}
                >
                  <ChevronsRight
                    className="h-5 w-5 cursor-pointer"
                    onClick={toggleOpen}
                  />
                </div>
                <Button
                  variant="outline"
                  className="gap-2 border-none"
                  size="sm"
                  onClick={() => setIsFullWidth(!isFullWidth)}
                >
                  {!isFullWidth ? (
                    <Maximize className="h-4 w-4" />
                  ) : (
                    <Minimize className="h-4 w-4" />
                  )}
                  <span className="text-sm">
                    {isFullWidth
                      ? t("voiceMode.minimize")
                      : t("learnTabs.toggleFullTabButton.expand")}
                  </span>
                </Button>
              </div>
              <div className="flex-grow overflow-y-auto scrollbar-hide">
                {children || <RightSidebarContent />}
              </div>
            </div>
          )}
        </aside>
      </>
    );
  },
);
