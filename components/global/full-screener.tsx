import { cn } from "@/lib/utils";
import React from "react";

const FullScreener = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "fixed inset-0 bg-background backdrop-blur-sm z-50 flex flex-col items-center justify-center",
        className,
      )}
    >
      {children}
    </div>
  );
};

export default FullScreener;
