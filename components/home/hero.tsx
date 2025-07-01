"use client";
import React, { useEffect, useState } from "react";
import MagicIcons from "./magic-icons";
import MagicHeading from "./magic-heading";
import ExamConfig from "../exam/exam-config";
import useSpaceExamStore from "@/hooks/use-space-exam-store";
import { useParams, useRouter, usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAddSpace } from "@/query-hooks/space";
import { useUserSpaces } from "@/query-hooks/user";
import { toast } from "sonner";
import MagicBarInput from "./magic-bar-input";

const Hero = () => {
  const { isSpaceExamOpen, reset, data, setData, setIsSpaceExamOpen } =
    useSpaceExamStore();
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const { data: spaces } = useUserSpaces();
  const { mutate: addSpace, isPending: isAddingSpace } = useAddSpace();

  const isSpacePage = pathname.startsWith("/space/");

  const handleCreateSpace = () => {
    addSpace(
      {
        spaceName: t("spaces.defaultSpaceName"),
        visibility: "private",
      },
      {
        onSuccess: (data) => {
          if (data && data._id) {
            router.push(`/space/${data._id}?highlight=exam`);
          }
        },
      },
    );
  };

  const openExamCreation = (spaceId: string) => {
    if (!spaceId) {
      console.error("No space ID provided to openExamCreation");
      return;
    }

    setData({ space_id: spaceId });

    setTimeout(() => {
      setIsSpaceExamOpen(true);
    }, 0);
  };

  const renderDefaultContents = () => {
    const handleCreateExam = () => {
      if (!spaces || spaces.length === 0) {
        handleCreateSpace();
      } else if (spaces.length === 1) {
        const space = spaces[0];
        const spaceId = space.space.id || space.space._id;

        if (!spaceId) {
          console.error("Space doesn't have an ID:", space);
          toast.error("Error finding your space. Please try again.");
          return;
        }

        router.push(`/space/${spaceId}?highlight=exam`);
      }
    };

    return (
      <div className="w-full flex flex-col items-center gap-[13px] sm:gap-[13px] mt-12 sm:px-10 lg:px-24 mb-12 sm:mb-24 sm:mt-20 ">
        {/* {!isSpacePage && (
          <div className="flex justify-center w-full mb-[-4]">
            {spaces && spaces.length > 1 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="rounded-full pl-0.5 pr-2.5 flex items-center gap-1.5 text-sm bg-green-500/10 text-[#3CB371] dark:text-[#7DFF97] hover:bg-green-500/20 border border-green-500/20 hover:border-green-500/30 font-normal">
                    <span className="text-[10px] bg-green-500/10 text-[#3CB371] dark:text-[#7DFF97] px-1 py-0.5 rounded-full border border-green-500/20 uppercase ml-1">
                      {t("new")}
                    </span>
                    {t("testYourKnowledge")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="p-2 rounded-xl">
                  <div className="text-sm font-medium mb-2 min-w-[200px] cursor-default ml-2">
                    {t("chooseASpace")}
                  </div>
                  {spaces.map((space: Space) => {
                    const spaceId = space.id || space._id;
                    if (!spaceId) return null;

                    return (
                      <DropdownMenuItem
                        key={spaceId}
                        onClick={() =>
                          router.push(`/space/${spaceId}?highlight=exam`)
                        }
                        className="flex items-center gap-2 p-2 rounded-md"
                      >
                        <Box className="h-4 w-4" />
                        {space.name}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={handleCreateExam}
                className="rounded-full pl-0.5 pr-2.5 flex items-center gap-1.5 text-sm bg-green-500/10 text-[#3CB371] dark:text-[#7DFF97] hover:bg-green-500/20 border border-green-500/20 hover:border-green-500/30 font-normal"
                disabled={isAddingSpace}
              >
                <span className="text-[10px] bg-green-500/10 text-[#3CB371] dark:text-[#7DFF97] px-1 py-0.5 rounded-full border border-green-500/20 uppercase ml-1">
                  {t("new")}
                </span>
                {t("testYourKnowledge")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        )} */}
        <MagicHeading />
        <MagicIcons />
        <div className="2xl:max-w-[672px] xl:max-w-[576px] md:max-w-[512px] w-full">
          <MagicBarInput />
        </div>
      </div>
    );
  };

  const renderSpaceExamView = () => {
    return (
      <div className="w-full flex flex-col items-center sm:px-10 lg:px-28 mt-2 sm:mt-5">
        <div className="pt-6 border-2 border-secondary bg-neutral-100/20 dark:bg-neutral-900/80 shadow-md dark:shadow-[0_0_8px_rgba(255,255,255,0.1)] rounded-xl w-full flex flex-col items-center gap-6 sm:gap-6 px-10 lg:px-24 sm:min-h-[420px] min-h-[460px] animate-in zoom-in-95 duration-300">
          <ExamConfig />
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (params.spaceId !== data?.space_id) {
      reset();
      setData({ space_id: params.spaceId as string });
    }
  }, [params, reset, setData, data]);

  if (isSpaceExamOpen) {
    return renderSpaceExamView();
  }

  return renderDefaultContents();
};

export default Hero;
