"use client";
import useAuth from "@/hooks/use-auth";
import { useModalStore } from "@/hooks/use-modal-store";
import { useGetSpace, useUpdateSpace } from "@/query-hooks/space";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { useParams } from "next/navigation";
import { ChangeEvent, KeyboardEvent, Suspense, lazy, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  SpaceDescriptionSkeleton,
  SpaceHeaderSkeleton,
} from "../skeleton/space-skeleton";
import ContentView from "./content-view";
import { useContentViewStore } from "@/hooks/use-content-view-store";
import SpaceChat from "../global/space-chat";
import ExamButton from "../exam/exam-button";
import ExamProgressButton from "../exam/exam-progress-button";

const SpaceDescription = lazy(() => import("./space-description"));

const SpaceHeader = () => {
  const { t } = useTranslation();
  const params = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data } = useGetSpace(params.spaceId as string);
  const { contentView } = useContentViewStore();

  const [editSpaceName, setEditSpaceName] = useState(false);
  const [spaceNameInput, setSpaceNameInput] = useState(data?.space.name);

  const spaceName = data?.space.name;

  const { mutate: updateSpace } = useUpdateSpace();

  const handleIconClick = () => {
    setSpaceNameInput(spaceName);
    setEditSpaceName(true);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSpaceNameInput(e.target.value);
  };

  const handleInputBlur = () => {
    setEditSpaceName(false);
    if (spaceNameInput !== spaceName) {
      updateSpace(
        {
          spaceId: params.spaceId as string,
          spaceName: spaceNameInput!,
          description: data?.space.description!,
          visibility: data?.space.visibility!,
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: ["userSpaces", user?.uid],
            });
          },
        },
      );
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      handleInputBlur();
    }
  };

  if (!data) return <SpaceHeaderSkeleton key="header-skeleton" />;

  return (
    <div
      className="w-full mt-10 sm:px-10 lg:px-28"
      key="space-header-container"
    >
      <div
        className="flex flex-col md:flex-row md:items-center md:space-x-4 justify-between"
        key="space-header-layout"
      >
        <div className="flex flex-col w-full" key="space-header-main">
          <div
            className="text-lg md:text-2xl lg:text-3xl flex flex-row items-center group w-full md:mb-4"
            key="space-title-container"
          >
            {editSpaceName ? (
              <input
                key="space-name-input"
                maxLength={150}
                className="outline-none text-neutral-400 w-full bg-transparent"
                type="text"
                value={spaceNameInput}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onKeyDown={handleKeyDown}
                autoFocus
                placeholder={t("spaceHeader.inputPlaceholder")}
              />
            ) : (
              <span key="space-name-display">{spaceName}</span>
            )}
            {!editSpaceName && (
              <Pencil
                key="edit-pencil-icon"
                className="opacity-50 ml-3 mt-1 cursor-pointer xl:opacity-0 group-hover:opacity-50 text-sm sm:text-lg"
                onClick={handleIconClick}
                size={16}
              />
            )}
          </div>
          <div
            className="w-full flex md:mt-0 mt-3"
            key="space-description-container"
          >
            <Suspense
              fallback={<SpaceDescriptionSkeleton key="description-skeleton" />}
            >
              <SpaceDescription key="space-description" {...data.space} />
            </Suspense>
          </div>
        </div>
        <div className="flex flex-col space-y-2 md:mt-0 mt-6 md:justify-end gap-2">
          <div className="hidden sm:flex gap-3 flex-row-reverse md:flex-row md:justify-start justify-end">
            <SpaceChat />
            <ExamProgressButton />
            <ExamButton />
          </div>
          <div className="flex sm:hidden gap-3 flex-row-reverse md:flex-row md:justify-start justify-end flex-wrap">
            <ExamProgressButton />
            <ExamButton />
            <SpaceChat />
          </div>
          <div
            key="space-chat-button-container"
            className="flex md:justify-end"
          >
            <ContentView />
          </div>
        </div>
      </div>
      <div
        className="text-right text-sm w-full text-muted-foreground"
        key="content-count-container"
      >
        {contentView === "grid" && (
          <>
            <div className="mt-3.5 md:mt-[38px] flex justify-end mr-4">
              <span
                key="content-count"
                className="text-sm text-muted-foreground font-medium"
              >
                {data.contents?.length ?? 0}{" "}
                {data.contents?.length === 1
                  ? t("spaceHeader.item")
                  : t("spaceHeader.items")}
              </span>
            </div>
            <div
              className="border-b border-border mt-[14px] w-full"
              key="bottom-border"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default SpaceHeader;
