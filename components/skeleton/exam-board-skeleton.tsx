import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Logo from "@/components/global/logo";

const ExamBoardSkeleton = () => {
  return (
    <div className="sm:p-6 max-w-4xl mx-auto font-sans space-y-8">
      {/* Top Progress Bar */}
      <Skeleton className="h-4 w-2/3 sm:w-5/6 mt-4 sm:mt-2 mx-auto" />

      {/* Header Area (e.g., Exam Chat button) */}
      <div className="flex justify-end absolute top-[-20] right-4">
        <Skeleton className="h-10 w-10 sm:w-28" />
      </div>

      <div className="flex justify-center pt-12"></div>
      {/* Question Block 1 */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-3/4" /> {/* Question Text */}
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" /> {/* Option A */}
          <Skeleton className="h-12 w-full" /> {/* Option B */}
          <Skeleton className="h-12 w-full" /> {/* Option C */}
          <Skeleton className="h-12 w-full" /> {/* Option D */}
        </div>
        <Skeleton className="h-36 w-full" /> {/* Feedback Box */}
      </div>

      {/* Question Block 2 */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-3/4" /> {/* Question Text */}
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" /> {/* Option A */}
          <Skeleton className="h-12 w-full" /> {/* Option B */}
          <Skeleton className="h-12 w-full" /> {/* Option C */}
          <Skeleton className="h-12 w-full" /> {/* Option D */}
        </div>
        {/* Optional: Add feedback box skeleton if needed for the second question too */}
        {/* <Skeleton className="h-20 w-full" /> */}
      </div>

      {/* Bottom Buttons */}
      <div className="flex justify-center space-x-4 pt-4 fixed bottom-6 left-1/2 -translate-x-1/2">
        <Skeleton className="h-10 w-32" /> {/* Try Again Button */}
        <Skeleton className="h-10 w-32" /> {/* View Results Button */}
      </div>
    </div>
  );
};

export default ExamBoardSkeleton;
