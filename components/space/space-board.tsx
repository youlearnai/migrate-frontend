"use client";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import useAuth from "@/hooks/use-auth";
import { useContentViewStore } from "@/hooks/use-content-view-store";
import { useLeftSidebar } from "@/hooks/use-left-sidebar";
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import { useStore } from "@/hooks/use-store";
import useUserPermission from "@/hooks/use-user-permission";
import { Content, SpaceContent, SpaceDetails } from "@/lib/types";
import { useGetSpace, useUpdateSpaceContent } from "@/query-hooks/space";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  defaultDropAnimationSideEffects,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useQueryClient } from "@tanstack/react-query";
import {
  AudioLines,
  Check,
  MessageSquareText,
  Mic,
  Play,
  Text,
  X,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import ContentCard from "../global/content-card";
import { ContentTable } from "../global/content-table";
import { defaultDropdownItems } from "../global/options-dropdown";
import { SpaceBoardSkeleton } from "../skeleton/space-skeleton";
import { SortableContentCard } from "./sortable-content-card";
import useSpaceExamStore from "@/hooks/use-space-exam-store";

const SpaceBoard = () => {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { contentView } = useContentViewStore();
  const { mutate: updateContent } = useUpdateSpaceContent();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const {
    isSpaceExamOpen,
    selectedContents,
    toggleContent,
    setSelectedContents,
  } = useSpaceExamStore();

  const rightSidebar = useStore(useRightSidebar, (state) => state);
  const isRightSidebarOpen = rightSidebar?.getOpenState() ?? false;

  const leftSidebar = useStore(useLeftSidebar, (state) => state);
  const isLeftSidebarOpen = leftSidebar?.getOpenState() ?? false;

  const gridClasses = useMemo(() => {
    let gridColsXlClass = "xl:grid-cols-3";
    let gridCols2xlClass = "2xl:grid-cols-4";
    if (isRightSidebarOpen) {
      gridColsXlClass = "xl:grid-cols-2";
      gridCols2xlClass = "2xl:grid-cols-3";
      if (isLeftSidebarOpen) {
        gridColsXlClass = "xl:grid-cols-1";
        gridCols2xlClass = "2xl:grid-cols-2";
      }
    }
    return { gridColsXlClass, gridCols2xlClass };
  }, [isRightSidebarOpen, isLeftSidebarOpen]);

  const { data } = useGetSpace(params.spaceId as string);
  const { userPermission } = useUserPermission(data?.access_control!);
  const role = userPermission?.role;

  const contents = useMemo(() => data?.contents || [], [data?.contents]);

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 10,
      tolerance: 5,
      delay: 250,
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 300,
      distance: 10,
      tolerance: 5,
    },
  });

  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: (event: Event) => {
      return {
        x: (event as MouseEvent).clientX,
        y: (event as MouseEvent).clientY,
      };
    },
  });

  const sensors = useSensors(touchSensor, pointerSensor, keyboardSensor);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<
    SpaceDetails["contents"][0] | null
  >(null);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      setActiveId(active.id as string);
      const foundItem = contents.find((item) => item.content_id === active.id);
      if (foundItem) {
        setDraggedItem(foundItem);
      }
      document.body.classList.add("dragging");
      document.body.classList.add("select-none");
      document.body.style.cursor = "grabbing";
    },
    [contents],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      setDraggedItem(null);
      document.body.classList.remove("dragging", "select-none");
      document.body.style.cursor = "";

      const { active, over } = event;
      if (!active?.id || !over?.id || active.id === over.id) return;

      const oldIndex = contents.findIndex(
        (item) => item.content_id === active.id,
      );
      const newIndex = contents.findIndex(
        (item) => item.content_id === over.id,
      );

      if (oldIndex === -1 || newIndex === -1) return;

      const updatedContents = [...contents];
      const [movedItem] = updatedContents.splice(oldIndex, 1);
      updatedContents.splice(newIndex, 0, movedItem);

      queryClient.setQueryData(
        ["getSpace", user?.uid || "anonymous", params.spaceId],
        (old: SpaceDetails) => ({
          ...old,
          contents: updatedContents,
        }),
      );

      const start = Math.min(oldIndex, newIndex);
      const end = Math.max(oldIndex, newIndex);

      const updatedWithIndices = updatedContents.map(
        (content, idx): SpaceContent => ({
          content_id: content.content_id,
          content_title: content.title,
          idx: idx,
        }),
      );

      const changedItems = updatedWithIndices.slice(start, end + 1);

      updateContent({
        spaceId: params.spaceId as string,
        spaceContents: changedItems,
      });
    },
    [contents, queryClient, updateContent, user?.uid, params.spaceId],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      router.push(`/space/${params.spaceId}?page=${newPage}`);
    },
    [router, params.spaceId],
  );

  const dropdownItems = useMemo(
    () =>
      role === "owner" ? defaultDropdownItems : [{ type: "move" as const }],
    [role],
  );

  const getTypeIcon = (type: Content["type"]) => {
    switch (type) {
      case "youtube":
      case "video":
        return <Play className="w-4 h-4 flex-shrink-0" />;
      case "stt":
        return <Mic className="w-4 h-4 flex-shrink-0" />;
      case "audio":
        return <AudioLines className="w-4 h-4 flex-shrink-0" />;
      case "conversation":
        return <MessageSquareText className="w-4 h-4 flex-shrink-0" />;
      default:
        return <Text className="w-4 h-4 flex-shrink-0" />;
    }
  };

  const isSelected = useCallback(
    (contentId: string) => {
      return (
        isSpaceExamOpen &&
        selectedContents.some((c) => c.content_id === contentId)
      );
    },
    [isSpaceExamOpen, selectedContents],
  );

  const handleContentClick = useCallback(
    (e: React.MouseEvent<HTMLElement>, contentId: string) => {
      if (isSpaceExamOpen) {
        e.preventDefault();
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
        const content = contents.find((c) => c.content_id === contentId);
        if (content) {
          toggleContent(content);
        }
      }
    },
    [isSpaceExamOpen, toggleContent, contents],
  );

  // Set selected contents when space is loaded
  useEffect(() => {
    if (data && isSpaceExamOpen) {
      setSelectedContents(data.contents);
    }
  }, [data, setSelectedContents, isSpaceExamOpen]);

  if (!data || !userPermission) return <SpaceBoardSkeleton />;

  return (
    <div
      className="flex flex-col w-full items-center justify-center"
      key="space-board-root"
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {contentView === "grid" ? (
          <div className="w-full h-full">
            <Suspense fallback={<SpaceBoardSkeleton key="board-skeleton" />}>
              <SortableContext
                items={contents.map((item) => item.content_id)}
                strategy={rectSortingStrategy}
              >
                <div
                  className={`items-center justify-center sm:mx-10 mb-10 lg:mx-28 mt-6 grid gap-4 sm:gap-8 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 ${gridClasses.gridColsXlClass} ${gridClasses.gridCols2xlClass} min-[1920px]:grid-cols-6`}
                  key="content-grid"
                  style={{
                    touchAction: "pan-x pan-y",
                    userSelect: "none",
                  }}
                >
                  {contents.map((content, index) => (
                    <div
                      className="relative max-w-fit"
                      key={content.content_id}
                    >
                      <SortableContentCard
                        key={content.content_id}
                        content={content}
                        priority={index <= 3}
                        spaceId={params.spaceId as string}
                        dropdownItems={dropdownItems}
                        className={`flex flex-col justify-between shadow-[0_4px_10px_rgba(0,0,0,0.02)] hover:dark:border-neutral-700/40 bg-white dark:bg-neutral-800/50 cursor-pointer transition-all duration-200 rounded-2xl border dark:border-secondary group ${activeId === content.content_id ? "opacity-50" : ""}`}
                      />
                      {isSpaceExamOpen && (
                        <div
                          className="absolute inset-0 z-30 cursor-pointer rounded-lg"
                          onClick={(e) =>
                            handleContentClick(e, content.content_id)
                          }
                        >
                          {isSelected(content.content_id) && (
                            <>
                              <div className="absolute inset-0 bg-muted/60 border-2 border-primary/60 rounded-lg animate-in zoom-in-95"></div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Check className="w-8 h-8 text-primary/80 stroke-[3]" />
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </SortableContext>
            </Suspense>
          </div>
        ) : (
          <div className="w-full h-full">
            <Suspense fallback={<SpaceBoardSkeleton key="board-skeleton" />}>
              <div
                className="sm:mx-10 lg:mx-28 md:mt-6 grid gap-8"
                key="content-list"
              >
                <SortableContext
                  items={contents.map((item) => item.content_id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ContentTable
                    dropdownItems={dropdownItems}
                    items={contents}
                    activeId={activeId}
                    isTestMode={isSpaceExamOpen}
                    selectedContents={selectedContents}
                    onContentClick={handleContentClick}
                  />
                </SortableContext>
              </div>
            </Suspense>
          </div>
        )}
        <DragOverlay
          dropAnimation={{
            duration: 200,
            easing: "cubic-bezier(0.4, 0, 0.2, 1)",
            sideEffects: defaultDropAnimationSideEffects({
              styles: {
                active: {
                  opacity: "1",
                },
              },
            }),
          }}
        >
          {draggedItem && contentView === "grid" ? (
            <ContentCard
              {...draggedItem}
              priority={false}
              spaceId={params.spaceId as string}
              dropdownItems={[]}
              className="flex flex-col justify-between bg-transparent dark:bg-neutral-800/50 rounded-2xl border shadow-lg transform-gpu"
            />
          ) : draggedItem ? (
            <Table>
              <TableBody>
                <TableRow className="bg-transparent dark:bg-neutral-800/50 shadow-lg">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span>{getTypeIcon(draggedItem.type)}</span>
                      <span className="truncate max-w-[200px] sm:max-w-[400px] md:max-w-[320px] xl:max-w-[460px] 2xl:max-w-[800px] block">
                        {draggedItem.title}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {new Date(draggedItem.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="hidden md:table-cell capitalize">
                    {draggedItem.visibility}
                  </TableCell>
                  <TableCell className="text-right w-[50px]" />
                </TableRow>
              </TableBody>
            </Table>
          ) : null}
        </DragOverlay>
      </DndContext>
      {data?.contents?.length === 0 && (
        <div
          className={`${contentView === "list" ? "my-4 sm:my-8" : "my-8 sm:my-0"} flex w-full items-center justify-center mx-auto flex-col`}
          key="empty-state"
        >
          <div className="flex flex-row" key="empty-title">
            <h1
              className="text-lg sm:text-xl text-center mr-1"
              key="empty-heading"
            >
              {t("spaceBoard.addContent")}
            </h1>
          </div>
          <h2
            className="mt-4 sm:text-base text-sm text-neutral-500 text-center md:hidden block"
            key="mobile-empty-subtitle"
          >
            {t("spaceBoard.learnTwiceFast")}
          </h2>
          <h2
            className="mt-4 sm:text-base text-sm text-neutral-500 text-center text-wrap px-8 md:block hidden"
            key="desktop-empty-subtitle"
          >
            {t("spaceBoard.avoidTedious")}
          </h2>
        </div>
      )}
    </div>
  );
};

export default SpaceBoard;
