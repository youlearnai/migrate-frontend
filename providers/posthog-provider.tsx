"use client";
import useAuth from "@/hooks/use-auth";
import posthog, { CapturedNetworkRequest } from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import React, { useEffect } from "react";

if (typeof window !== "undefined") {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_API_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
    person_profiles: "identified_only",
    mask_all_text: false,
    mask_all_element_attributes: false,
    capture_pageview: false,
    capture_pageleave: false,
    capture_performance: false,
    capture_heatmaps: false,
    capture_exceptions: false,
    session_recording: {
      maskCapturedNetworkRequestFn: (request: CapturedNetworkRequest) => {
        return request;
      },
    },
  });
}

export function CSPostHogProvider({
  children,
}: {
  children: React.ReactElement;
}) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const fetchSplit = async () => {
        const response = await fetch("/api/split");
        return response.json();
      };
      fetchSplit();
    }
  }, []);

  useEffect(() => {
    if (!loading && user) {
      posthog.identify(user.uid);
      posthog.people.set({ email: user.email });
    }
  }, [loading, user]);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
