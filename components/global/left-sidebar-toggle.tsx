import { Button } from "@/components/ui/button";
import { SidebarToggleProps } from "@/lib/types";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import Logo from "./logo";

export function LeftSidebarToggle({ isOpen, setIsOpen }: SidebarToggleProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (
      pathname === "/signin" ||
      pathname === "/signup" ||
      pathname === "/reset-password" ||
      pathname === "/pricing" ||
      pathname === "/contact"
    ) {
      if (isOpen) {
        setIsOpen?.();
      }
    }
  }, [pathname, setIsOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault();
        if (
          pathname !== "/pricing" &&
          pathname !== "/contact" &&
          pathname !== "/signin" &&
          pathname !== "/signup" &&
          pathname !== "/reset-password"
        ) {
          setIsOpen?.();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [pathname, setIsOpen]);

  return (
    <div className="invisible flex items-center justify-center my-auto space-x-4 lg:visible">
      {!isOpen && (
        <>
          <Button
            onClick={() => setIsOpen?.()}
            className="rounded-md w-8 h-8 border-none"
            variant="outline"
            size="icon"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Logo />
        </>
      )}
    </div>
  );
}
