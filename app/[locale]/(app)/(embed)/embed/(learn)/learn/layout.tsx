import { ThemeProvider } from "@/providers/theme-provider";
import React from "react";
import FullScreener from "@/components/global/full-screener";

const learnGroupLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <FullScreener className="w-full">
        <main className="flex-1 overflow-hidden p-2 relative h-screen flex flex-col w-full">
          {children}
        </main>
      </FullScreener>
    </ThemeProvider>
  );
};

export default learnGroupLayout;
