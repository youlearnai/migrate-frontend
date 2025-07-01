import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useFlashcardStore } from "@/hooks/use-flashcard-store";
import {
  FlashcardSettingsFormData,
  Flashcard,
  KeyConcept,
  FlashcardProgress,
} from "@/lib/types";
import { useModalStore } from "@/hooks/use-modal-store";
import { Option } from "../ui/multi-select";
import MultipleSelector from "../ui/multi-select";
import { useMemo, useState } from "react";
import { Star, Clock, Info, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { LearningStepsInput } from "@/components/learn/learning-steps-input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

// Extract the form schema to reuse for type inference
const createFormSchema = (allCardsLength: number) =>
  z.object({
    dailyLimit: z.coerce
      .number()
      .min(1, "Limit must be at least 1")
      .max(allCardsLength, `Limit must be at most ${allCardsLength}`),
    starredOnly: z.boolean().default(false),
    selectedKeyConcepts: z
      .array(
        z.object({
          value: z.string(),
          label: z.string(),
        }),
      )
      .default([]),
    learningSteps: z
      .array(z.number())
      .min(1, "At least one learning step is required"),
  });

export function FlashcardActiveRecallSettingsModal() {
  const { t } = useTranslation();
  const { isOpen, onClose, type, data } = useModalStore();
  const isModalOpen = isOpen && type === "flashcardActiveRecallSettings";
  const { onSubmit, allCards, keyConcepts, progress, learningSteps } = data;

  const { displayModifiers } = useFlashcardStore();

  // Add state for inline step adding
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [newStep, setNewStep] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
  });

  const hasStarredFlashcards = useMemo(() => {
    return allCards?.some((flashcard) => flashcard.is_starred) || false;
  }, [allCards]);

  const keyConceptOptions: Option[] = useMemo(() => {
    if (!keyConcepts) return [];

    return keyConcepts.map((concept) => ({
      value: concept._id,
      label: concept.concept,
    }));
  }, [keyConcepts]);

  const formSchema = createFormSchema(allCards?.length || 100);
  type FormSchema = z.infer<typeof formSchema>;

  // Initialize form with all data at once
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    values: {
      dailyLimit: progress?.daily_new_limit || 20,
      starredOnly: displayModifiers.showOnlyStarred,
      selectedKeyConcepts: keyConceptOptions.filter((opt) =>
        displayModifiers.selectedKeyConcepts?.includes(opt.value),
      ),
      learningSteps: learningSteps || [60, 600], // Use data from modal store
    },
  });

  const handleAddStep = () => {
    const totalSeconds =
      newStep.days * 86400 + newStep.hours * 3600 + newStep.minutes * 60;

    if (totalSeconds > 0) {
      const currentSteps = form.getValues("learningSteps");
      const newValue = [...currentSteps, totalSeconds].sort((a, b) => a - b);
      form.setValue("learningSteps", newValue, { shouldDirty: true });
      setNewStep({ days: 0, hours: 0, minutes: 0 });
      setIsAddingStep(false);
    }
  };

  const handleCancelAddStep = () => {
    setNewStep({ days: 0, hours: 0, minutes: 0 });
    setIsAddingStep(false);
  };

  const handleSubmit = (formData: FormSchema) => {
    const submitData: FlashcardSettingsFormData = {
      dailyLimit: formData.dailyLimit,
      starredOnly: formData.starredOnly,
      selectedKeyConcepts: formData.selectedKeyConcepts.map((opt) => opt.value),
      learningSteps: formData.learningSteps,
      // Pass the actual dirtyFields without type issues
      dirtyFields: form.formState.dirtyFields,
    };

    // Update the store with the selected key concepts
    const { setDisplayModifiers } = useFlashcardStore.getState();
    setDisplayModifiers({
      ...displayModifiers,
      showOnlyStarred: formData.starredOnly,
      selectedKeyConcepts: formData.selectedKeyConcepts.map((opt) => opt.value),
    });

    onSubmit?.(submitData);
    onClose();
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("flashcards.preferences")}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-primary/80">
                {t("flashcards.dailyLimit")}
              </h3>
              <div className="flex items-center gap-2">
                <FormField
                  control={form.control}
                  name="dailyLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} className="h-10 w-20" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <span className="text-sm text-muted-foreground">
                  {t("flashcards.cards")}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-primary/80">
                  {t("flashcards.learningSteps")}
                </h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-muted-foreground cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">
                        {t("flashcards.learningStepsInfo")}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <FormField
                control={form.control}
                name="learningSteps"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <LearningStepsInput
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {isAddingStep && (
                <div className="mt-3 p-3 border rounded-lg bg-muted/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">
                      Review {form.watch("learningSteps")?.length + 1 || 1}
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setIsAddingStep(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="days"
                        className="text-sm text-muted-foreground"
                      >
                        Days
                      </Label>
                      <Input
                        id="days"
                        type="number"
                        min="0"
                        value={newStep.days}
                        onChange={(e) =>
                          setNewStep({
                            ...newStep,
                            days: parseInt(e.target.value) || 0,
                          })
                        }
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="hours"
                        className="text-sm text-muted-foreground"
                      >
                        Hours
                      </Label>
                      <Input
                        id="hours"
                        type="number"
                        min="0"
                        max="23"
                        value={newStep.hours}
                        onChange={(e) =>
                          setNewStep({
                            ...newStep,
                            hours: parseInt(e.target.value) || 0,
                          })
                        }
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="minutes"
                        className="text-sm text-muted-foreground"
                      >
                        Minutes
                      </Label>
                      <Input
                        id="minutes"
                        type="number"
                        min="0"
                        max="59"
                        value={newStep.minutes}
                        onChange={(e) =>
                          setNewStep({
                            ...newStep,
                            minutes: parseInt(e.target.value) || 0,
                          })
                        }
                        className="h-10"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCancelAddStep}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddStep}
                      disabled={
                        newStep.days === 0 &&
                        newStep.hours === 0 &&
                        newStep.minutes === 0
                      }
                    >
                      {t("smartkbd.add")}
                    </Button>
                  </div>
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setIsAddingStep(true)}
                disabled={isAddingStep}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("smartkbd.add")}
              </Button>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <h3 className="text-sm font-medium text-primary/80">
                {t("flashcards.filterOptions")}
              </h3>

              <div>
                <FormField
                  control={form.control}
                  name="starredOnly"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0 rounded-lg border p-2 px-3">
                      <div className="flex items-center gap-3">
                        <Star
                          className={`w-4 h-4 ${field.value ? "fill-current text-yellow-500" : "text-muted-foreground"}`}
                        />
                        <Label
                          htmlFor="starred-only"
                          className={cn(
                            "text-sm font-medium cursor-pointer",
                            !hasStarredFlashcards && "text-muted-foreground/50",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {t("flashcards.starredOnly")}
                        </Label>
                      </div>
                      <FormControl>
                        <Switch
                          id="starred-only"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!hasStarredFlashcards}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2">
                <h4 className="text-sm text-muted-foreground">
                  {t("flashcards.filterByKeyConcepts")}
                </h4>
                <FormField
                  control={form.control}
                  name="selectedKeyConcepts"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <MultipleSelector
                          value={field.value}
                          onChange={field.onChange}
                          options={keyConceptOptions}
                          placeholder={t("flashcards.selectKeyConcepts")}
                          emptyIndicator={
                            <p className="text-center text-sm text-muted-foreground">
                              {t("flashcards.noKeyConceptsFound")}
                            </p>
                          }
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                {t("accountDeleteModal.cancelButton")}
              </Button>
              <Button type="submit" disabled={!form.formState.isDirty}>
                {t("flashcards.applySettings")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
