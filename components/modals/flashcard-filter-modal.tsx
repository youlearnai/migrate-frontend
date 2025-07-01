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
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useFlashcardStore } from "@/hooks/use-flashcard-store";
import { useModalStore } from "@/hooks/use-modal-store";
import { Option } from "../ui/multi-select";
import MultipleSelector from "../ui/multi-select";
import { useMemo } from "react";
import { Filter, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function FlashcardFilterModal() {
  const { t } = useTranslation();
  const { isOpen, onClose, type, data } = useModalStore();
  const isModalOpen = isOpen && type === "flashcardFilter";
  const { flashcards, keyConcepts } = data;

  const { displayModifiers } = useFlashcardStore();

  const hasStarredFlashcards = useMemo(() => {
    return flashcards?.some((flashcard) => flashcard.is_starred) || false;
  }, [flashcards]);

  const keyConceptOptions: Option[] = useMemo(() => {
    if (!keyConcepts) return [];

    return keyConcepts.map((concept) => ({
      value: concept._id,
      label: concept.concept,
    }));
  }, [keyConcepts]);

  const formSchema = z.object({
    starredOnly: z.boolean().default(false),
    selectedKeyConcepts: z
      .array(
        z.object({
          value: z.string(),
          label: z.string(),
        }),
      )
      .default([]),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: {
      starredOnly: displayModifiers.showOnlyStarred,
      selectedKeyConcepts: keyConceptOptions.filter((opt) =>
        displayModifiers.selectedKeyConcepts?.includes(opt.value),
      ),
    },
  });

  const handleSubmit = (formData: z.infer<typeof formSchema>) => {
    // Update the store with the selected preferences
    const { setDisplayModifiers } = useFlashcardStore.getState();
    setDisplayModifiers({
      ...displayModifiers,
      showOnlyStarred: formData.starredOnly,
      selectedKeyConcepts: formData.selectedKeyConcepts.map((opt) => opt.value),
    });

    onClose();
  };

  const handleClearAll = () => {
    form.setValue("starredOnly", false);
    form.setValue("selectedKeyConcepts", []);
  };

  const hasActiveFilters =
    form.watch("starredOnly") || form.watch("selectedKeyConcepts").length > 0;

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center font-medium gap-2">
            <Filter className="w-5 h-5" />
            {t("flashcards.filterOptions")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6 mt-1"
          >
            <div className="space-y-4">
              <div className="space-y-3">
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
                          autoFocus
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {keyConceptOptions.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    {t("flashcards.filterByKeyConcepts")}
                    {form.watch("selectedKeyConcepts").length > 0 && (
                      <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                        {form.watch("selectedKeyConcepts").length} selected
                      </span>
                    )}
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
                            maxSelected={5}
                            hidePlaceholderWhenSelected
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClearAll}
                  className="mr-auto"
                >
                  Clear all
                </Button>
              )}
              <Button type="button" variant="outline" onClick={onClose}>
                {t("accountDeleteModal.cancelButton")}
              </Button>
              <Button type="submit">{t("flashcards.applySettings")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
