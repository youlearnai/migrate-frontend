import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { useModalStore } from "@/hooks/use-modal-store";
import { useGetFeedbackFlashcard } from "@/query-hooks/user";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

const formSchema = z.object({
  feedback: z.string().min(1, "Feedback is required"),
  score: z
    .number({ required_error: "Rating is required" })
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
});

const FlashcardFeedbackModal = () => {
  const { t } = useTranslation();
  const { isOpen, onClose, type } = useModalStore();
  const isModalOpen = isOpen && type === "flashcardFeedback";
  const { mutate: getFeedbackFlashcard } = useGetFeedbackFlashcard();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      feedback: "",
      score: undefined,
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    getFeedbackFlashcard(
      {
        feedback: values.feedback,
        score: values.score,
      },
      {
        onSuccess: () => {
          form.reset();
          toast.success(t("contact.form.submitSuccess"));
          onClose();
        },
      },
    );
  };

  const modalData = {
    heading: t("voiceLimitModal.heading"),
    description: {
      part1: t("voiceLimitModal.description.part1"),
      part2: t("voiceLimitModal.description.part2"),
    },
    textAreaPlaceholder: t("voiceLimitModal.textAreaPlaceholder"),
    buttons: {
      cancel: t("contentDeleteModal.cancel"),
      submit: t("feedback.submit"),
    },
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl font-medium">
            {modalData.heading}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <p className="text-sm text-muted-foreground">
              {modalData.description.part1}
            </p>

            <FormField
              control={form.control}
              name="score"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((starValue) => (
                        <button
                          key={starValue}
                          type="button"
                          onClick={() => field.onChange(starValue)}
                          className="p-1 hover:scale-110 transition-transform duration-200"
                        >
                          <Star
                            className={`w-8 h-8 transition-colors duration-200 ${
                              field.value && field.value >= starValue
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300 hover:text-yellow-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="feedback"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder={modalData.textAreaPlaceholder}
                      className="min-h-[100px] p-2 resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex space-x-2 gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={onClose}>
                {modalData.buttons.cancel}
              </Button>
              <Button type="submit">{modalData.buttons.submit}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default FlashcardFeedbackModal;
