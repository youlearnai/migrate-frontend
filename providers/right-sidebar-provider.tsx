"use client";
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";
import { useLeftSidebar } from "@/hooks/use-left-sidebar";

export default function RightSidebarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const leftSidebar = useStore(useLeftSidebar, (x) => x);
  const rightSidebar = useStore(useRightSidebar, (x) => x);
  if (!rightSidebar) return null;
  if (!leftSidebar) return null;
  const { getOpenState, isFullWidth } = rightSidebar;
  const { getOpenState: getLeftOpenState } = leftSidebar;

  return (
    <main
      className={cn(
        "sm:min-h-[calc(100vh_-_56px)] transition-[margin-right] ease-in-out duration-300",
        getLeftOpenState() && isFullWidth && "xl:mr-[calc(100%-16rem)]",
        getOpenState() && "xl:mr-[36rem]",
        !getOpenState() && "xl:mr-0",
      )}
    >
      {children}
    </main>
  );
}
