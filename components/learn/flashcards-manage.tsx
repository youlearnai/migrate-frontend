import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useErrorStore as useErrorModalStore } from "@/hooks/use-error-store";
import { hasChanges, useFlashcardStore } from "@/hooks/use-flashcard-store";
import { useModalStore } from "@/hooks/use-modal-store";
import { useScrollToElement } from "@/hooks/use-scroll-to-element";
import { ContentType, Flashcard, FlashcardFormData } from "@/lib/types";
import { formatMilliseconds } from "@/lib/utils";
import {
  useDeleteFlashcards,
  useGetAllFlashcardsActiveRecall,
  useGetContent,
  useGetFlashcards,
  useGetKeyConcepts,
  useGetTranscript,
  useUpdateFlashcards,
} from "@/query-hooks/content";
import { useGetTier } from "@/query-hooks/user";
import {
  closestCenter,
  defaultDropAnimationSideEffects,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { zodResolver } from "@hookform/resolvers/zod";
import { useVirtualizer } from "@tanstack/react-virtual";
import debounce from "lodash/debounce";
import { AlertCircle, ArrowLeft, FileDown, Plus, XCircle } from "lucide-react";
import { useParams } from "next/dist/client/components/navigation";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as z from "zod";
import Spinner from "../global/spinner";
import FlashcardsManageSkeleton from "../skeleton/flashcards-manage-skeleton";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Form } from "../ui/form";
import { SortableFlashcard } from "./sortable-flashcard";
import { isAudioType, isVideoType } from "@/lib/utils";

const FlashcardsManage = ({ intro = false }: { intro?: boolean }) => {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState<string | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const params = useParams();
  const { onOpen } = useModalStore();
  const { openModal: onErrorOpen } = useErrorModalStore();
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const {
    data,
    setData,
    editSession,
    setView,
    updateCard,
    markCardDeleted,
    restoreCard,
    clearEditSession,
    displayModifiers,
    mode,
  } = useFlashcardStore();
  const { data: flashcards, isLoading: flashcardsLoading } = useGetFlashcards(
    params.contentId as string,
  );
  const { data: transcript, isLoading: transcriptLoading } = useGetTranscript(
    params.contentId as string,
  );
  const {
    data: allFlashcardsActiveRecall,
    isLoading: allFlashcardsActiveRecallLoading,
    isRefetching: allFlashcardsActiveRecallRefetching,
  } = useGetAllFlashcardsActiveRecall(params.contentId as string, {
    enabled: mode === "activeRecall",
  });
  const { data: learnContent, isLoading: learnContentLoading } = useGetContent(
    params.spaceId as string,
    params.contentId as string,
    undefined,
    false,
  );
  const { mutate: updateFlashcards, isPending: updateFlashcardsPending } =
    useUpdateFlashcards();
  const { mutate: deleteFlashcards, isPending: deleteFlashcardsPending } =
    useDeleteFlashcards();
  const { data: keyConcepts } = useGetKeyConcepts(params.contentId as string);
  const { data: tier } = useGetTier();

  const isYTOrSTT =
    isVideoType(learnContent?.type as ContentType) ||
    isAudioType(learnContent?.type as ContentType);

  const maxSource = transcript?.[transcript?.length - 1]?.source;

  const flashcardSchema = z.object({
    _id: z.string().min(1, "ID is required"),
    question: z.string().min(1, "Question is required"),
    answer: z.string().min(1, "Answer is required"),
    hint: z.string().optional().default(""),
    explanation: z.string().optional().default(""),
    source: z
      .number()
      .min(0, "Source must be greater than 0")
      .max(
        maxSource as number,
        `Source must be less than ${isYTOrSTT ? formatMilliseconds(maxSource as number) : maxSource}`,
      )
      .optional()
      .default(0),
    idx: z.number().optional(),
    is_starred: z.boolean().optional().default(false),
    key_concept: z
      .object({
        id: z.string().optional(),
        collection: z.string().min(1, "Collection name is required"),
      })
      .optional()
      .nullable(),
  });

  const formSchema = z.object({
    flashcards: z.array(flashcardSchema),
  });

  type FormData = z.infer<typeof formSchema>;

  const getMergedFlashcards = useCallback(() => {
    if (!flashcards) return [];

    if (
      !editSession.editedCards ||
      Object.keys(editSession.editedCards).length === 0
    ) {
      return flashcards;
    }

    const existingIds = new Set(flashcards.map((card) => card._id));

    const newCards = Object.entries(editSession.editedCards)
      .filter(([id]) => !existingIds.has(id))
      .map(([_, card]) => card);

    const mergedExistingCards = flashcards.map((card) => {
      if (!card._id) return card;
      const editedCard = editSession.editedCards[card._id];
      return editedCard ? { ...card, ...editedCard } : card;
    });

    const allCards = [...mergedExistingCards, ...newCards];
    return allCards.sort((a, b) => (a.idx || 0) - (b.idx || 0));
  }, [flashcards, editSession.editedCards]);

  const form = useForm<FlashcardFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      flashcards: getMergedFlashcards(),
    },
    values: {
      flashcards: getMergedFlashcards() as Flashcard[],
    },
  });

  const { fields, move, insert, remove } = useFieldArray({
    control: form.control,
    name: "flashcards",
  });

  const formErrors = form.formState.errors;
  const hasErrors = Object.keys(formErrors).length > 0;

  const getNextReviewDate = (flashcardId: string) => {
    const flashcard = allFlashcardsActiveRecall?.flashcards.find(
      (flashcard) => flashcard.flashcard_id === flashcardId,
    );
    return flashcard?.next_review_date;
  };

  const onSubmit = async () => {
    const promises = [];
    if (Object.keys(editSession.editedCards).length > 0) {
      promises.push(
        new Promise((resolve, reject) => {
          updateFlashcards(
            {
              contentId: params.contentId as string,
              flashcards: Object.entries(editSession.editedCards).map(
                ([cardId, card]) => ({
                  question: card.question,
                  answer: card.answer,
                  source: card.source as number,
                  hint: card.hint as string,
                  explanation: card.explanation as string,
                  key_concept: card.key_concept?.id as string,
                  is_starred: card.is_starred as boolean,
                  id: cardId,
                  idx: card.idx as number,
                  is_new: !cardId.startsWith("cfc-"),
                }),
              ),
            },
            {
              onSuccess: resolve,
              onError: reject,
            },
          );
        }),
      );
    }

    if (editSession.deletedCardIds.length > 0) {
      promises.push(
        new Promise((resolve, reject) => {
          deleteFlashcards(
            {
              contentId: params.contentId as string,
              flashcardIds: editSession.deletedCardIds,
            },
            {
              onSuccess: resolve,
              onError: reject,
            },
          );
        }),
      );
    }

    try {
      await Promise.all(promises);
      clearEditSession();
      form.reset();

      setView("display", {
        contentId: params.contentId as string,
      });
    } catch (error) {
      console.error("Error saving flashcards:", error);
    }
  };

  const handleClose = () => {
    setView("display", {
      contentId: params.contentId as string,
    });
  };

  const handleRevertChanges = () => {
    if (!flashcards) return;

    form.reset({
      flashcards: flashcards,
    });

    clearEditSession();
  };

  const virtualizer = useVirtualizer({
    count: fields.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 340, []),
    overscan: 3,
    measureElement: useCallback((element: Element) => {
      if (element) {
        const style = getComputedStyle(element);
        const margin =
          parseFloat(style.marginTop) + parseFloat(style.marginBottom);
        return element.getBoundingClientRect().height + margin;
      }
      return 340;
    }, []),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    document.body.style.cursor = "grabbing";
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    document.body.style.cursor = "";

    if (active.id !== over?.id) {
      const oldIndex = fields.findIndex((item) => item._id === active.id);
      const newIndex = fields.findIndex((item) => item._id === over?.id);

      const element = document.getElementById(active.id as string);
      if (element) {
        element.style.transition =
          "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)";
        setTimeout(() => {
          if (element) element.style.transition = "";
        }, 300);
      }

      move(oldIndex, newIndex);

      const newItems = arrayMove([...fields], oldIndex, newIndex).map(
        (item, index) => ({
          ...item,
          idx: index,
        }),
      );

      newItems.forEach((field, index) => {
        form.setValue(`flashcards.${index}.idx`, field.idx);
      });

      newItems.forEach((card) => {
        if (card._id) {
          updateCard(card._id, { idx: card.idx });
        }
      });
    }
    setActiveId(null);
  };

  const isNewCard = (id: string) => {
    return !id.startsWith("cfc-");
  };

  const handleDelete = (id: string) => {
    const index = fields.findIndex((item) => item._id === id);
    if (isNewCard(id)) {
      remove(index);

      const currentFormValues = form.getValues("flashcards");

      const cardsAfter = currentFormValues.slice(index);
      cardsAfter.forEach((card) => {
        if (card._id && card._id !== id) {
          updateCard(card._id, { idx: (card.idx || 0) - 1 });
        }
      });

      const updatedFields = fields
        .filter((item) => item._id !== id)
        .map((item, idx) => ({ ...item, idx }));

      form.setValue("flashcards", updatedFields, {
        shouldDirty: true,
        shouldTouch: true,
      });

      const currentState = useFlashcardStore.getState();
      const newEditedCards = { ...currentState.editSession.editedCards };
      delete newEditedCards[id];
      useFlashcardStore.setState({
        editSession: {
          ...currentState.editSession,
          editedCards: newEditedCards,
        },
      });
    } else {
      markCardDeleted(id);
    }
  };

  const handleAddBelow = (id: string) => {
    const index = fields.findIndex((item) => item._id === id);
    const uniqueId = Date.now().toString();

    const currentFormValues = form.getValues("flashcards");
    const cardsAfter = currentFormValues.slice(index + 1);
    cardsAfter.forEach((card) => {
      if (card._id) {
        updateCard(card._id, { idx: (card.idx || 0) + 1 });
      }
    });

    const newCard = {
      id: uniqueId,
      _id: uniqueId,
      question: "",
      answer: "",
      hint: "",
      explanation: "",
      source: 0,
      key_concept: {
        id: "",
        collection: "content_key_concepts",
      },
      is_starred: false,
      idx: index + 1,
      metadata: {},
      created_at: new Date(),
    };

    const updatedFields = [
      ...currentFormValues.slice(0, index + 1),
      newCard,
      ...currentFormValues.slice(index + 1),
    ].map((item, idx) => ({ ...item, idx }));

    insert(index + 1, newCard);

    form.setValue("flashcards", updatedFields, {
      shouldDirty: true,
      shouldTouch: true,
    });

    updateCard(uniqueId, newCard);

    setData({
      ...data,
      flashcardId: uniqueId,
    });
  };

  const handleExport = () => {
    if (tier === "anonymous") {
      onErrorOpen({
        status: 401,
        statusText: "Please sign in to export flashcards",
      });
    } else {
      onOpen("exportFlashcards", {
        flashcards: flashcards,
        keyConcepts: keyConcepts,
      });
    }
  };

  const handleChange = useCallback(
    debounce(
      (
        id: string,
        field: keyof Flashcard,
        value: string | number | boolean | { id: string; collection: string },
      ) => {
        const flashcardIndex = fields.findIndex((item) => item._id === id);
        if (flashcardIndex !== -1) {
          form.setValue(`flashcards.${flashcardIndex}.${field}`, value, {
            shouldDirty: true,
            shouldTouch: true,
          });
        }

        updateCard(id, {
          [field]: value,
        });
      },
      1000,
      { leading: false, trailing: true },
    ),
    [fields, form, updateCard],
  );

  const memoizedFields = useMemo(() => fields, [fields]);

  const handleRestore = (id: string) => {
    restoreCard(id);
  };

  const scrollToElement = useScrollToElement(virtualizer);

  const areFlashcardsEqual = React.useCallback(
    (original: Flashcard, editedFields: Partial<Flashcard>): boolean => {
      return Object.entries(editedFields).every(([key, value]) => {
        const typedKey = key as keyof Flashcard;

        if (typedKey === "key_concept") {
          const originalConcept = original[typedKey];
          const editedConcept = value as typeof originalConcept;

          return (
            originalConcept?.id === editedConcept?.id &&
            originalConcept?.collection === editedConcept?.collection
          );
        }

        return original[typedKey] === value;
      });
    },
    [],
  );

  const compareFlashcardArrays = React.useCallback(
    (
      original: Flashcard[],
      editedFlashcards: Record<string, Partial<Flashcard>>,
      deletedCardIds?: string[],
    ): boolean => {
      if (!original) return false;
      if (deletedCardIds?.length) return true;

      const editedIds = Object.keys(editedFlashcards);
      if (editedIds.length === 0) return false;

      const cardsToRemove: string[] = [];

      editedIds.forEach((cardId) => {
        if (!cardId.startsWith("cfc-")) return;

        const originalCard = original.find((card) => card._id === cardId);
        const editedFields = editedFlashcards[cardId];

        if (originalCard && areFlashcardsEqual(originalCard, editedFields)) {
          cardsToRemove.push(cardId);
        }
      });

      if (cardsToRemove.length > 0) {
        const currentState = useFlashcardStore.getState();
        const newEditedCards = { ...currentState.editSession.editedCards };

        cardsToRemove.forEach((cardId) => {
          delete newEditedCards[cardId];
        });

        useFlashcardStore.setState({
          editSession: {
            ...currentState.editSession,
            editedCards: newEditedCards,
          },
        });
      }

      return (
        Object.keys(useFlashcardStore.getState().editSession.editedCards)
          .length > 0
      );
    },
    [areFlashcardsEqual],
  );

  useEffect(() => {
    compareFlashcardArrays(
      flashcards as Flashcard[],
      editSession.editedCards,
      editSession.deletedCardIds,
    );
  }, [flashcards, editSession.editedCards, editSession.deletedCardIds]);

  useEffect(() => {
    if (data && data.flashcardId) {
      const index =
        fields.findIndex((field) => field._id === data.flashcardId) + 1;

      if (index !== 0) {
        virtualizer.scrollToIndex(index, {
          align: "end",
          behavior: "auto",
        });

        scrollToElement(data.flashcardId, {
          onScrollEnd: () => {
            const element = document.getElementById(data.flashcardId!);
            if (element) {
              const questionInput = element.querySelector(
                `input[name="flashcards.${index - 1}.question"]`,
              ) as HTMLInputElement;
              if (questionInput) {
                questionInput.focus();
              }
            }
          },
        });

        setData({
          ...data,
          flashcardId: undefined,
        });
      }
    }
  }, [data, setData, fields, virtualizer, scrollToElement]);

  const handleToggleExpand = (id: string) => {
    setExpandedCardId(expandedCardId === id ? null : id);
  };

  if (
    flashcardsLoading ||
    transcriptLoading ||
    learnContentLoading ||
    allFlashcardsActiveRecallLoading ||
    allFlashcardsActiveRecallRefetching
  ) {
    return <FlashcardsManageSkeleton />;
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="h-full w-full flex flex-col overflow-y-auto overscroll-y-none"
      >
        <TooltipProvider>
          <div className="flex justify-between items-center space-x-2 mb-2">
            <div className="flex items-center">
              {intro ? (
                mode === "activeRecall" && (
                  <span className="text-lg font-medium">
                    {t("featureMentions.flashcardsDisplay")}{" "}
                    <span className="text-muted-foreground font-normal text-sm">
                      ({fields.length})
                    </span>
                  </span>
                )
              ) : (
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t("flashcards.goBack")}
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleExport}
                  >
                    <FileDown className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("flashcards.export")}</TooltipContent>
              </Tooltip>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mr-2"
                onClick={handleRevertChanges}
                disabled={!hasChanges()}
              >
                {t("flashcards.revertChanges")}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={
                  !hasChanges() ||
                  hasErrors ||
                  updateFlashcardsPending ||
                  deleteFlashcardsPending
                }
              >
                {updateFlashcardsPending || deleteFlashcardsPending ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  t("flashcards.done")
                )}
              </Button>
            </div>
          </div>
          {(hasChanges() || hasErrors) && (
            <>
              <div className="h-px bg-border mb-4" />
              <div className="flex items-center space-x-4 mb-4 ml-4">
                {hasChanges() && (
                  <div className="flex items-center space-x-1 text-yellow-600 dark:text-yellow-500 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{t("flashcards.unsaved")}</span>
                  </div>
                )}
                {hasErrors && (
                  <div className="flex items-center space-x-1 text-destructive text-sm">
                    <XCircle className="w-4 h-4" />
                    <span>{t("flashcards.errors")}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </TooltipProvider>
        <div
          ref={parentRef}
          className="flex-1 overflow-y-auto md:mb-8 relative"
          style={{
            height: "100%",
            position: "relative",
            minHeight: "0px",
            maxHeight: "calc(100vh - 230px)",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            autoScroll={{
              threshold: { x: 0, y: 0.2 },
              acceleration: 15,
              interval: 5,
            }}
          >
            <SortableContext
              items={memoizedFields.map((item) => item._id)}
              strategy={verticalListSortingStrategy}
            >
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative",
                  contain: "strict",
                }}
              >
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  // Sort fields by key concepts and next review date
                  const sortedFields = [...memoizedFields].sort((a, b) => {
                    // Only apply sorting in active recall mode
                    if (mode === "activeRecall") {
                      // First, prioritize starred cards if showOnlyStarred is true
                      if (displayModifiers.showOnlyStarred) {
                        const aIsStarred = a.is_starred || false;
                        const bIsStarred = b.is_starred || false;

                        if (aIsStarred && !bIsStarred) return -1;
                        if (!aIsStarred && bIsStarred) return 1;
                      }

                      // Then, prioritize cards with key concepts matching displayModifiers
                      const aHasMatchingConcept =
                        displayModifiers.selectedKeyConcepts?.includes(
                          a.key_concept?.id || "",
                        );
                      const bHasMatchingConcept =
                        displayModifiers.selectedKeyConcepts?.includes(
                          b.key_concept?.id || "",
                        );

                      if (aHasMatchingConcept && !bHasMatchingConcept)
                        return -1;
                      if (!aHasMatchingConcept && bHasMatchingConcept) return 1;

                      // Finally, sort by next review date
                      const nextReviewA = getNextReviewDate(a._id);
                      const nextReviewB = getNextReviewDate(b._id);

                      // Cards with no review date should come last
                      if (!nextReviewA && !nextReviewB)
                        return (a.idx || 0) - (b.idx || 0);
                      if (!nextReviewA) return 1;
                      if (!nextReviewB) return -1;

                      // Sort by next review date (earliest first - overdue and due soon come first)
                      return (
                        new Date(nextReviewA).getTime() -
                        new Date(nextReviewB).getTime()
                      );
                    }

                    // Default to original index order for non-active recall modes
                    return (a.idx || 0) - (b.idx || 0);
                  });

                  const flashcard = sortedFields[virtualRow.index];
                  // Find the original index in memoizedFields for form handling
                  const originalIndex = memoizedFields.findIndex(
                    (field) => field._id === flashcard._id,
                  );

                  return (
                    <div
                      key={flashcard.id}
                      ref={(el) => virtualizer.measureElement(el)}
                      data-index={virtualRow.index}
                      style={{
                        transform: `translateY(${virtualRow.start}px)`,
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        paddingTop: "8px",
                        paddingBottom: "8px",
                      }}
                    >
                      <SortableFlashcard
                        nextReviewDate={getNextReviewDate(flashcard._id)}
                        flashcard={flashcard}
                        index={originalIndex}
                        onDelete={handleDelete}
                        onAddBelow={handleAddBelow}
                        onChange={handleChange}
                        type={learnContent?.type!}
                        isDeleted={editSession.deletedCardIds.some(
                          (id) => id === flashcard._id,
                        )}
                        form={form}
                        onRestore={handleRestore}
                        hasErrors={!!formErrors.flashcards?.[originalIndex]}
                        expandedCardId={expandedCardId || undefined}
                        onToggleExpand={handleToggleExpand}
                      />
                    </div>
                  );
                })}
              </div>
            </SortableContext>
            <DragOverlay
              dropAnimation={{
                duration: 200,
                easing: "cubic-bezier(0.4, 0, 0.2, 1)",
                sideEffects: defaultDropAnimationSideEffects({
                  styles: {
                    active: {
                      opacity: "0.4",
                    },
                  },
                }),
              }}
              modifiers={[]}
            >
              {activeId ? (
                <div className="opacity-100 transform-gpu">
                  <Card className="p-4 mb-4 bg-background border-2 border-primary/20 shadow-lg">
                    {fields.find((field) => field._id === activeId)?.question}
                  </Card>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed mt-4 border-2 border-primary/10 bg-transparent"
            onClick={() => handleAddBelow(fields[fields.length - 1]._id)}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("flashcards.addCard")}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default FlashcardsManage;
