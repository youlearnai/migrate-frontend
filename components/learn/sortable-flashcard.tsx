import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ExtendedSortableFlashcardProps } from "@/lib/types";
import { cn, formatMilliseconds } from "@/lib/utils";
import { useGetKeyConcepts } from "@/query-hooks/content";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Grip, Plus, Star, Trash2, Undo2 } from "lucide-react";
import { useParams } from "next/navigation";
import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { isAudioType, isVideoType } from "@/lib/utils";
import { formatDistanceToNow, isPast, differenceInHours } from "date-fns";
import { Badge } from "../ui/badge";
import * as locales from "date-fns/locale";
import { useFlashcardStore } from "@/hooks/use-flashcard-store";

export const SortableFlashcard = memo(function SortableFlashcard({
  flashcard,
  index,
  type,
  onDelete,
  onAddBelow,
  onChange,
  form,
  isDeleted,
  onRestore,
  hasErrors,
  expandedCardId,
  onToggleExpand,
  nextReviewDate,
}: ExtendedSortableFlashcardProps) {
  const isYTOrSTT = isVideoType(type) || isAudioType(type);
  const params = useParams();
  const { data: keyConcepts, isLoading: keyConceptsLoading } =
    useGetKeyConcepts(params.contentId as string);
  const [showActions, setShowActions] = React.useState(false);
  const showAdvanced = expandedCardId === flashcard._id;
  const { t } = useTranslation();
  const { mode } = useFlashcardStore();

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useSortable({
      id: flashcard._id,
      disabled: !showActions,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging
      ? undefined
      : "transform 200ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)",
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : undefined,
  };

  const timestampToSeconds = (timestamp: string) => {
    if (!timestamp || timestamp.includes("_")) return 0;
    const [hours, minutes, seconds] = timestamp.split(":");
    return (
      parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseFloat(seconds)
    );
  };

  const secondsToTimestamp = (seconds: number) => {
    if (!seconds) return "";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = (seconds % 60).toFixed(0);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(Math.abs(parseInt(secs))).padStart(2, "0")}`;
  };

  const getReviewBadgeColors = (reviewDate: Date) => {
    if (isPast(reviewDate)) {
      // Overdue - red
      return "bg-red-500/10 text-red-600 dark:text-red-400";
    }

    const hoursUntilReview = differenceInHours(reviewDate, new Date());

    if (hoursUntilReview <= 6) {
      // Very soon - orange
      return "bg-orange-500/5 dark:bg-orange-500/10 text-orange-500 dark:text-orange-400";
    } else if (hoursUntilReview <= 24) {
      // Soon - yellow
      return "bg-yellow-500/5 dark:bg-yellow-500/10 text-yellow-500 dark:text-yellow-500";
    } else if (hoursUntilReview <= 72) {
      // Approaching - green
      return "bg-green-500/5 dark:bg-green-500/10 text-green-500 dark:text-green-400";
    } else {
      // Future - blue (default)
      return "bg-blue-500/5 dark:bg-blue-500/10 text-blue-500 dark:text-[#7DBAFF]";
    }
  };

  if (keyConceptsLoading) {
    return <Skeleton className="h-[100px] w-full" />;
  }

  return (
    <TooltipProvider>
      <div
        ref={setNodeRef}
        id={flashcard._id}
        style={style}
        className={cn(
          "relative group will-change-transform",
          isDragging &&
            "after:absolute after:inset-0 after:bg-muted/30 after:border-2 after:border-dashed after:p-4 after:border-muted-foreground/30 after:rounded-lg",
        )}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <Card
          className={cn(
            "p-4 mb-4 relative transition-all duration-200 dark:bg-neutral-950/60",
            isDragging ? "shadow-lg cursor-grabbing" : "hover:shadow-md",
            showActions ? "ring-1 ring-primary/20" : "",
            isDeleted &&
              "relative before:absolute before:inset-0 before:bg-background/80 before:z-50 cursor-not-allowed",
            hasErrors && "ring-2 ring-destructive",
          )}
        >
          {isDeleted && (
            <div className="absolute inset-0 z-[51] flex items-center justify-center">
              <Button
                variant="secondary"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => onRestore(flashcard._id)}
              >
                <Undo2 className="h-4 w-4" />
                {t("flashcards.revertChanges")}
              </Button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    {t("flashcards.form.card")} {flashcard.idx + 1}
                  </p>
                  <FormField
                    control={form.control}
                    name={`flashcards.${index}.is_starred`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Toggle
                                size="sm"
                                pressed={field.value}
                                onPressedChange={(pressed) => {
                                  field.onChange(pressed);
                                  onChange(
                                    flashcard._id,
                                    "is_starred",
                                    pressed,
                                  );
                                }}
                                className="h-7 w-7 p-0 data-[state=on]:bg-transparent"
                              >
                                <Star
                                  className={cn(
                                    "w-4 h-4",
                                    field.value
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "",
                                  )}
                                />
                              </Toggle>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {t(
                                  "flashcards.starActions." +
                                    (field.value ? "remove" : "add"),
                                )}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  {mode === "activeRecall" && nextReviewDate && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs text-muted-foreground px-1.5 py-1 rounded-sm border-none font-medium",
                        getReviewBadgeColors(nextReviewDate),
                      )}
                    >
                      {isPast(nextReviewDate)
                        ? t("flashcards.dueNow")
                        : t("flashcards.nextReviewShort", {
                            date: formatDistanceToNow(nextReviewDate, {
                              locale:
                                locales[params.locale as keyof typeof locales],
                              addSuffix: true,
                            }).replace(/^\w/, (c) => c.toUpperCase()),
                          })}
                    </Badge>
                  )}
                  {flashcard.key_concept?.id && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs text-muted-foreground bg-muted px-1.5 py-1 rounded-sm border-none font-medium",
                      )}
                    >
                      {
                        keyConcepts?.find(
                          (kc) => kc._id === flashcard.key_concept?.id,
                        )?.concept
                      }
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 opacity-100 xl:opacity-0 group-hover:opacity-100 transition-opacity">
                  {mode === "fastReview" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      className="text-xs flex items-center gap-1"
                      onClick={() => onAddBelow(flashcard._id)}
                    >
                      <Plus className="h-3 w-3" />
                      <span>{t("flashcards.form.addBelow")}</span>
                    </Button>
                  )}
                  <Tooltip>
                    {mode === "fastReview" && (
                      <TooltipTrigger asChild>
                        <div
                          {...attributes}
                          {...listeners}
                          className="cursor-grab active:cursor-grabbing"
                        >
                          <Grip className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </TooltipTrigger>
                    )}
                    <TooltipContent>
                      <p>{t("flashcards.form.dragTooltip")}</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={() => onDelete(flashcard._id)}
                        className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t("flashcards.form.deleteTooltip")}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name={`flashcards.${index}.question`}
                  render={({ field }) => (
                    <FormItem>
                      <p className="text-sm font-medium mb-1">
                        {t("flashcards.form.term")}{" "}
                        <span className="text-destructive">
                          {t("flashcards.form.required")}
                        </span>
                      </p>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t("flashcards.form.termPlaceholder")}
                          onChange={(e) => {
                            field.onChange(e);
                            onChange(flashcard._id, "question", e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`flashcards.${index}.answer`}
                  render={({ field }) => (
                    <FormItem>
                      <p className="text-sm font-medium mb-1">
                        {t("flashcards.form.definition")}{" "}
                        <span className="text-destructive">
                          {t("flashcards.form.required")}
                        </span>
                      </p>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t(
                            "flashcards.form.definitionPlaceholder",
                          )}
                          onChange={(e) => {
                            field.onChange(e);
                            onChange(flashcard._id, "answer", e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {showAdvanced && (
                  <>
                    <FormField
                      control={form.control}
                      name={`flashcards.${index}.hint`}
                      render={({ field }) => (
                        <FormItem>
                          <p className="text-sm font-medium mb-1">
                            {t("flashcards.form.hint")}:
                          </p>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={t("flashcards.form.enterHint")}
                              onChange={(e) => {
                                field.onChange(e);
                                onChange(flashcard._id, "hint", e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`flashcards.${index}.explanation`}
                      render={({ field }) => (
                        <FormItem>
                          <p className="text-sm font-medium mb-1">
                            {t("flashcards.form.explanation")}:
                          </p>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={t(
                                "flashcards.form.enterExplanation",
                              )}
                              onChange={(e) => {
                                field.onChange(e);
                                onChange(
                                  flashcard._id,
                                  "explanation",
                                  e.target.value,
                                );
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`flashcards.${index}.source`}
                      render={({ field }) => (
                        <FormItem>
                          <p className="text-sm font-medium mb-1">
                            {t("flashcards.form.source")}:
                          </p>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              placeholder={
                                isYTOrSTT
                                  ? t("flashcards.form.enterTimstamp")
                                  : t("flashcards.form.enterPageNumber")
                              }
                              onChange={(e) => {
                                const value =
                                  e.target.value === ""
                                    ? 0
                                    : parseInt(e.target.value);
                                field.onChange(value);
                                onChange(flashcard._id, "source", value);
                              }}
                              value={field.value || undefined}
                            />
                          </FormControl>
                          {field.value > 0 && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {isYTOrSTT
                                ? `${t("flashcards.form.time")}: ${formatMilliseconds(field.value)}`
                                : `${t("flashcards.form.page")}: ${field.value}`}
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {keyConcepts && (
                      <FormField
                        control={form.control}
                        name={`flashcards.${index}.key_concept.id`}
                        render={({ field }) => (
                          <FormItem>
                            <p className="text-sm font-medium mb-1">
                              {t("flashcards.form.keyConcept")}:
                            </p>
                            <Select
                              value={field.value?.toString() || ""}
                              onValueChange={(value) => {
                                field.onChange(value);
                                onChange(flashcard._id, "key_concept", {
                                  id: value,
                                  collection: "content_key_concepts",
                                });
                              }}
                            >
                              <SelectTrigger className="flex h-10 p-6 w-full rounded-lg border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 transition-all duration-200 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                <SelectValue
                                  placeholder={t(
                                    "flashcards.form.keyConceptPlaceholder",
                                  )}
                                />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectLabel>
                                    {t("flashcards.form.keyConceptGroup")}
                                  </SelectLabel>
                                  {keyConcepts?.map((keyConcept) => (
                                    <SelectItem
                                      key={keyConcept._id}
                                      value={keyConcept._id}
                                      className="flex items-center justify-between w-full"
                                    >
                                      <span className="flex-1">
                                        {keyConcept.concept}
                                      </span>{" "}
                                      <span className="text-muted-foreground">
                                        (
                                        {!isYTOrSTT
                                          ? t("flashcards.form.page")
                                          : t("summary.timestampLabel")}{" "}
                                        {isYTOrSTT
                                          ? formatMilliseconds(
                                              keyConcepts?.find(
                                                (kc) =>
                                                  kc._id === keyConcept._id,
                                              )?.start_document.source || 0,
                                            )
                                          : keyConcepts?.find(
                                              (kc) => kc._id === keyConcept._id,
                                            )?.start_document.source}
                                        )
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="mt-2 text-xs text-muted-foreground"
                onClick={() => onToggleExpand(flashcard._id)}
              >
                {showAdvanced
                  ? t("flashcards.form.showLess")
                  : t("flashcards.form.showMore")}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </TooltipProvider>
  );
});
