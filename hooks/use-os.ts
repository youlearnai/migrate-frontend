import { useState, useEffect } from "react";

export type OperatingSystem =
  | "Windows"
  | "macOS"
  | "iOS"
  | "Android"
  | "Linux"
  | "Unknown";

export function useOS(): {
  os: OperatingSystem;
  isMac: boolean;
  isWindows: boolean;
  isMobile: boolean;
  isDesktop: boolean;
} {
  const [os, setOS] = useState<OperatingSystem>("Unknown");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const userAgent = window.navigator.userAgent;

    if (userAgent.indexOf("Win") !== -1) setOS("Windows");
    else if (userAgent.indexOf("Mac") !== -1) setOS("macOS");
    else if (
      userAgent.indexOf("iPhone") !== -1 ||
      userAgent.indexOf("iPad") !== -1
    )
      setOS("iOS");
    else if (userAgent.indexOf("Android") !== -1) setOS("Android");
    else if (userAgent.indexOf("Linux") !== -1) setOS("Linux");
  }, []);

  return {
    os,
    isMac: os === "macOS",
    isWindows: os === "Windows",
    isMobile: os === "iOS" || os === "Android",
    isDesktop: os === "Windows" || os === "macOS" || os === "Linux",
  };
}
