import React from "react";
import { Skeleton } from "../ui/skeleton";

const ChatSkeleton = () => {
  return (
    <div className="w-full mt-3 flex flex-col">
      <Skeleton className="flex w-4/5 rounded-xl text-right">
        <div className="h-20" />
      </Skeleton>
      <div className="flex flex-row mt-2 justify-end text-right">
        <Skeleton className="flex w-2/5 rounded-xl text-right">
          <div className="h-10" />
        </Skeleton>
      </div>
      <Skeleton className="flex w-full mt-2 rounded-xl text-right">
        <div className="h-40" />
      </Skeleton>
      <div className="flex flex-row mt-2 justify-end text-right">
        <Skeleton className="flex w-4/5 rounded-xl text-right">
          <div className="h-10" />
        </Skeleton>
      </div>
      <Skeleton className="md:flex hidden w-3/5 mt-2 rounded-xl text-right">
        <div className="h-24" />
      </Skeleton>
      <div className="2xl:flex hidden flex-row mt-2 justify-end text-right">
        <Skeleton className="flex w-4/6 rounded-xl text-right">
          <div className="h-16" />
        </Skeleton>
      </div>
      <div className="flex flex-row mt-2 justify-end text-right">
        <Skeleton className="flex w-2/5 rounded-xl text-right">
          <div className="h-10" />
        </Skeleton>
      </div>
      <Skeleton className="flex w-full mt-2 rounded-xl text-right">
        <div className="h-40" />
      </Skeleton>
      <div className="hidden 2xl:flex flex-row mt-2 justify-end text-right">
        <Skeleton className="flex w-4/5 rounded-xl text-right">
          <div className="h-10" />
        </Skeleton>
      </div>
    </div>
  );
};

export default ChatSkeleton;
