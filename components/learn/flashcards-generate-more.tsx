import React from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  useGenerateMoreFlashcards,
  useGetKeyConcepts,
} from "@/query-hooks/content";
import { useParams } from "next/navigation";
import MultipleSelector, { Option } from "@/components/ui/multi-select";
import { useFlashcardStore } from "@/hooks/use-flashcard-store";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import useAuth from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "../ui/input";

const generateMoreSchema = z.object({
  concepts: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
      }),
    )
    .min(1, "Select at least one concept"),
  cardCount: z.number().min(1).max(10),
});

type GenerateMoreFormValues = z.infer<typeof generateMoreSchema>;

const FlashcardsGenerateMoreButton = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const params = useParams();
  const { data: keyConcepts } = useGetKeyConcepts(params.contentId as string);
  const [isOpen, setIsOpen] = React.useState(false);
  const { mutate: generateMoreFlashcards } = useGenerateMoreFlashcards();
  const { clearEditSession, setView } = useFlashcardStore();

  const form = useForm<GenerateMoreFormValues>({
    resolver: zodResolver(generateMoreSchema),
    defaultValues: {
      concepts: [],
      cardCount: 5,
    },
  });

  const conceptOptions = React.useMemo(
    () =>
      keyConcepts?.map((concept) => ({
        value: concept._id,
        label: concept.concept,
      })) || [],
    [keyConcepts],
  );

  const onSubmit = async (values: GenerateMoreFormValues) => {
    const promises = [];
    promises.push(
      new Promise((resolve, reject) => {
        generateMoreFlashcards(
          {
            contentId: params.contentId as string,
            concepts: values.concepts.map((c) => c.value),
            count: values.cardCount,
          },
          {
            onSuccess: resolve,
            onError: reject,
          },
        );
      }),
    );

    try {
      await Promise.all(promises);
      await queryClient.invalidateQueries({
        queryKey: ["getFlashcards", user?.uid || "anonymous", params.contentId],
      });
      await queryClient.invalidateQueries({
        queryKey: [
          "getFlashcardsActiveRecall",
          user?.uid || "anonymous",
          params.contentId,
        ],
      });

      clearEditSession();
      form.reset();

      setView("display", {
        contentId: params.contentId as string,
      });
    } catch (error) {
      console.error("Error saving flashcards:", error);
    }
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full border rounded-xl"
    >
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between items-center py-6 text-md font-normal rounded-xl hover:bg-transparent"
        >
          <div className="flex items-center gap-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>{t("flashcards.generateMore")}</span>
          </div>
          <ChevronRight
            className={`w-5 h-5 text-primary transform transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pt-1 pb-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="concepts"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <Label>{t("flashcards.selectConcepts")}</Label>
                  <FormControl>
                    <MultipleSelector
                      options={conceptOptions}
                      placeholder={t("flashcards.selectConceptsPlaceholder")}
                      hidePlaceholderWhenSelected
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cardCount"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <Label>{t("flashcards.numberOfCards")}</Label>
                  <Input
                    type="number"
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              {t("flashcards.generate")}
            </Button>
          </form>
        </Form>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default FlashcardsGenerateMoreButton;
