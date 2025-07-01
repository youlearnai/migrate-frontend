"use client";
import { useLeftSidebar } from "@/hooks/use-left-sidebar";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";

export default function LeftSidebarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const sidebar = useStore(useLeftSidebar, (x) => x);
  if (!sidebar) return null;
  const { getOpenState, settings } = sidebar;
  return (
    <main
      className={cn(
        "sm:min-h-[calc(100vh_-_56px)] transition-[margin-left] ease-in-out duration-300",
        !settings.disabled && (!getOpenState() ? "lg:ml-0" : "lg:ml-64"),
      )}
    >
      {children}
    </main>
  );
}
