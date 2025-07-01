import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Logo from "@/components/global/logo";

const ExamProgressSkeleton = () => {
  return (
    <div className="sm:p-6 max-w-4xl mx-auto font-sans">
      {/* Logo */}
      <div className="hidden sm:block fixed top-4 left-4 z-50">
        <Logo size="sm" />
      </div>
      <div className="block sm:hidden fixed top-4 left-4 z-50">
        <Logo size="lg" />
      </div>

      {/* Close Button Skeleton */}
      <div className="fixed top-4 right-4 z-50">
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>

      {/* Exam Header Skeleton */}
      <div className="flex flex-col items-center mb-8 mt-4 sm:mt-0">
        <Skeleton className="h-6 w-24 mb-4" /> {/* Exam Title */}
        <div className="flex gap-4">
          <Skeleton className="h-4 w-32" /> {/* Countdown */}
          <Skeleton className="h-4 w-32" /> {/* Date */}
        </div>
      </div>

      {/* Progress Message Skeleton */}
      <div className="text-center mb-8">
        <Skeleton className="h-8 w-3/4 sm:w-1/2 mx-auto my-10 sm:my-12" />{" "}
        {/* Progress Message */}
      </div>

      {/* Stats Section Skeleton */}
      <div className="flex justify-center items-center gap-x-12 sm:gap-x-24 mb-8">
        {/* Skipped Stat */}
        <div className="text-center flex flex-col items-center">
          <Skeleton className="h-7 w-8 mb-1" /> {/* Skipped Number */}
          <Skeleton className="h-4 w-12" /> {/* Skipped Label */}
        </div>
        {/* Circular Progress Skeleton */}
        <Skeleton className="h-24 w-24 sm:h-32 sm:w-32 rounded-full" />
        {/* Total Time Stat */}
        <div className="text-center flex flex-col items-center">
          <Skeleton className="h-7 w-16 mb-1" /> {/* Time Value */}
          <Skeleton className="h-4 w-16" /> {/* Time Label */}
        </div>
      </div>

      {/* Preview Link Skeleton */}
      <div className="text-center mb-8 mr-4">
        <Skeleton className="h-5 w-40 mx-auto" /> {/* Preview Link */}
      </div>

      {/* Accordion Section Skeleton */}
      <div className="flex flex-col gap-6 mb-10 border rounded-2xl p-6 pb-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border-b last:border-b-0 pb-4 last:pb-0">
            <div className="flex items-center justify-between mb-4">
              {/* Content Title Skeleton */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" /> {/* Icon */}
                <Skeleton className="h-5 w-32 sm:w-48 md:w-64" /> {/* Title */}
              </div>
              {/* Content Progress Skeleton */}
              <div className="flex items-center gap-4">
                <Skeleton className="h-3.5 w-16 sm:w-24 md:w-32 rounded-full" />{" "}
                {/* Progress Bar */}
                <Skeleton className="h-5 w-10" /> {/* Count */}
              </div>
            </div>
            {/* Optional: Add skeleton lines for concepts if needed when expanded */}
          </div>
        ))}
      </div>

      {/* Accordion Section Skeleton */}
      <div className="flex flex-col gap-6 mb-10 border rounded-2xl p-6 pb-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border-b last:border-b-0 pb-4 last:pb-0">
            <div className="flex items-center justify-between mb-4">
              {/* Content Title Skeleton */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" /> {/* Icon */}
                <Skeleton className="h-5 w-32 sm:w-48 md:w-64" /> {/* Title */}
              </div>
              {/* Content Progress Skeleton */}
              <div className="flex items-center gap-4">
                <Skeleton className="h-3.5 w-16 sm:w-24 md:w-32 rounded-full" />{" "}
                {/* Progress Bar */}
                <Skeleton className="h-5 w-10" /> {/* Count */}
              </div>
            </div>
            {/* Optional: Add skeleton lines for concepts if needed when expanded */}
          </div>
        ))}
      </div>

      {/* Action Buttons Skeleton */}
      <div className="flex justify-center gap-4 mb-8">
        <Skeleton className="h-10 w-24" /> {/* Try Again Button */}
        <Skeleton className="h-10 w-24" /> {/* New Exam Button */}
      </div>
    </div>
  );
};

export default ExamProgressSkeleton;
