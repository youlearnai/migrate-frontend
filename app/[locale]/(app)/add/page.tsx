"use client";

import { useStartSTTQuery } from "@/query-hooks/content";
import { useRouter } from "next/navigation";
import React from "react";
import Loading from "@/app/[locale]/loading";

const RecordPage = () => {
  const router = useRouter();
  const { data, isLoading } = useStartSTTQuery(
    `Recording at ${new Date().toLocaleTimeString()}`,
  );

  if (data) {
    router.push(`/learn/content/${data.content_id}`);
  }

  if (isLoading) {
    return <Loading />;
  }
};

export default RecordPage;
