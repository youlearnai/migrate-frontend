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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useModalStore } from "@/hooks/use-modal-store";
import { useGetFeedbackVoice } from "@/query-hooks/user";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";
import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  feedback: z.string().optional(),
  score: z.number().min(1).max(5),
});

const VoiceLimitModal = () => {
  const { t } = useTranslation();
  const { isOpen, onClose, type, onOpen } = useModalStore();
  const isModalOpen = isOpen && type === "voiceLimit";
  const { mutate: getFeedbackVoice } = useGetFeedbackVoice();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      feedback: "",
      score: undefined,
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    getFeedbackVoice(
      {
        feedback: values.feedback || "",
        score: values.score,
      },
      {
        onSuccess: (data, variables) => {
          toast.success(t("contact.form.submitSuccess"));
        },
      },
    );

    onOpen("schedule", {
      calLink: "youlearn/youlearn-voice-mode-session",
      scheduleDescription: t("voiceLimitModal.scheduleDescription"),
    });
    onClose();
  };

  const handleScheduleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onOpen("schedule", {
      calLink: "youlearn/youlearn-voice-mode-session",
      scheduleDescription: t("voiceLimitModal.scheduleDescription"),
    });
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
              <span
                className="cursor-pointer text-green-500 dark:text-[#7DFF97]/100 hover:text-green-600 dark:hover:text-[#7DFF97]"
                onClick={handleScheduleClick}
              >
                {modalData.description.part2}
              </span>
            </p>

            <FormField
              control={form.control}
              name="score"
              render={({ field }) => (
                <FormItem>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a rating" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">1 - Poor</SelectItem>
                      <SelectItem value="2">2 - Fair</SelectItem>
                      <SelectItem value="3">3 - Good</SelectItem>
                      <SelectItem value="4">4 - Very Good</SelectItem>
                      <SelectItem value="5">5 - Excellent</SelectItem>
                    </SelectContent>
                  </Select>
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

export default VoiceLimitModal;
