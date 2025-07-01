"use client";
import SearchCommand from "@/components/commands/search-command";
import { useEffect, useState } from "react";

export default function CommandProvider() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <SearchCommand />
    </>
  );
}
