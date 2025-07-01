import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MenuIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LeftSidebarContent } from "./left-sidebar-content";
import Logo from "./logo";

export function SheetMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const showTrigger =
    pathname !== "/pricing" &&
    pathname !== "/contact" &&
    pathname !== "/signin" &&
    pathname !== "/signup" &&
    pathname !== "/reset-password";

  useEffect(() => {
    if (open) {
      setOpen(false);
    }
  }, [pathname]);

  return (
    <>
      {!showTrigger && (
        <div className="h-8 flex justify-center items-center"></div>
      )}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="logo" size="icon">
            <MenuIcon size={20} />
          </Button>
        </SheetTrigger>
        <SheetContent
          className="w-64 bg-neutral-100 dark:bg-neutral-900 scrollbar-hide overflow-y-auto px-1 h-full flex flex-col"
          side="left"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onFocusCapture={(e) => e.stopPropagation()}
          style={{ touchAction: "manipulation" }}
        >
          <SheetTitle className="flex font-normal items-center ml-4 space-x-3 mb-2">
            <Logo />
          </SheetTitle>
          <div className="flex-grow overflow-y-auto">
            <LeftSidebarContent />
          </div>
          <div className="h-16"></div>
        </SheetContent>
      </Sheet>
    </>
  );
}
