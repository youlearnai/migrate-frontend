"use client";
import { useLeftSidebar } from "@/hooks/use-left-sidebar";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";
import { ChevronsLeft } from "lucide-react";
import { memo, useState, useEffect } from "react";
import { LeftSidebarContent } from "./left-sidebar-content";
import { LeftSidebarToggle } from "./left-sidebar-toggle";
import Logo from "./logo";
import { usePathname } from "next/navigation";

export const LeftSidebar = memo(() => {
  const sidebar = useStore(useLeftSidebar, (x) => x);
  const [isHovering, setIsHovering] = useState(false);
  const pathname = usePathname();

  // Force close the sidebar when on signin path
  useEffect(() => {
    if (
      sidebar &&
      (pathname === "/signin" ||
        pathname === "/signup" ||
        pathname === "/reset-password") &&
      sidebar.getOpenState()
    ) {
      sidebar.setIsOpen(false);
    }
  }, [pathname, sidebar]);

  if (!sidebar) return null;

  const { toggleOpen, getOpenState, setIsHover, settings } = sidebar;

  // For signin page, only show the logo but not the sidebar toggle
  if (
    pathname === "/signin" ||
    pathname === "/signup" ||
    pathname === "/reset-password"
  ) {
    return (
      <div className="invisible lg:visible fixed top-0 left-0 z-20 pt-6 pl-6">
        <Logo />
      </div>
    );
  }

  return (
    <>
      <LeftSidebarToggle isOpen={getOpenState()} setIsOpen={toggleOpen} />
      <aside
        className={cn(
          "fixed top-0 left-0 z-20 h-screen border-r -translate-x-full lg:translate-x-0 transition-all ease-in-out duration-300",
          getOpenState() ? "w-64" : "w-0",
          settings.disabled && "hidden",
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
            className="bg-neutral-50 dark:bg-neutral-800/50 relative overflow-y-auto overscroll-y-none h-full flex flex-col px-1 py-4"
          >
            <div className="flex items-center justify-between ml-4 mr-2 mb-6">
              <Logo />
              <div
                className={cn(
                  "transition-opacity duration-300 ease-in-out",
                  isHovering ? "opacity-100" : "opacity-100 xl:opacity-0",
                )}
              >
                <ChevronsLeft
                  className="h-5 w-5 cursor-pointer"
                  onClick={toggleOpen}
                />
              </div>
            </div>
            <div className="flex-grow overflow-y-auto overscroll-y-none scrollbar-hide">
              <LeftSidebarContent />
            </div>
            <div className="h-24"></div>
          </div>
        )}
      </aside>
    </>
  );
});
