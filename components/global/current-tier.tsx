import React from "react";
import { useGetTier } from "@/query-hooks/user";
import { Crown } from "lucide-react";
import { Button } from "../ui/button";

const CurrentTier = () => {
  const { data, isLoading } = useGetTier();

  if (isLoading || data === "anonymous" || data === "free") return null;

  return (
    <Button
      size="sm"
      className="dark:border dark:text-primary border-primary dark:hover:bg-background h-7 space-x-1 inline-flex dark:bg-transparent"
    >
      <Crown className="shrink-0 animate-shimmer h-4 w-4" />
      <span className="capitalize">{data}</span>
    </Button>
  );
};

export default CurrentTier;
