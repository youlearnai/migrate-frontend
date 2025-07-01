"use client";
import { useTheme } from "next-themes";
import HolyLoader from "holy-loader";
import React from "react";

export default function TopLoader() {
  const { theme } = useTheme();

  return (
    <HolyLoader
      color={theme === "light" ? "#000000" : "#ffffff"}
      initialPosition={0.08}
      height={2}
      showSpinner={false}
      easing="ease"
      speed={150}
    />
  );
}
