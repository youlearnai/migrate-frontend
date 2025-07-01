import React from "react";
import { useCustomChatLoadingStore } from "@/hooks/use-custom-chat-loading-store";

const CustomChatLoading = () => {
  const { isLoading, type } = useCustomChatLoadingStore();

  if (!isLoading) return null;

  const renderLoading = () => {
    switch (type) {
      case "message":
        return (
          <div className="w-2 h-2 bg-primary/80 rounded-full animate-pulse" />
        );
      default:
        return null;
    }
  };
  return <>{renderLoading()}</>;
};

export default CustomChatLoading;
