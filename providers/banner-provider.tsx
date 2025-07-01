"use client";

import ChatLimitBanner from "@/components/banners/chat-limit-banner";
import DiscountBanner from "@/components/banners/discount-banner";
import ServerMaintenanceBanner from "@/components/banners/server-maintenance-banner";
import VerifyBanner from "@/components/banners/verify-banner";
import OutageBanner from "@/components/banners/outage-banner";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const BannerProvider = () => {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }
  return (
    <>
      {/* <OutageBanner /> */}
      <VerifyBanner />
      {/* <ServerMaintenanceBanner /> */}
      {!pathname.includes("/sign") && !pathname.includes("/verify") && (
        <ChatLimitBanner />
      )}
      {/* {(pathname === "/" ||
        pathname.startsWith("/space/") ||
        pathname === "/profile") && <DiscountBanner />} */}
    </>
  );
};

export default BannerProvider;
