import React from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@nextui-org/modal";
import { useModalStore } from "@/hooks/use-modal-store";
import { usePauseSubscription } from "@/query-hooks/user";
import { useTranslation } from "react-i18next";
import { addMonths } from "date-fns";
import Spinner from "@/components/global/spinner";
import { PauseCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const formSchema = z.object({
  resumeDate: z.date({
    required_error: "Resume date is required",
  }),
});

type FormValues = z.infer<typeof formSchema>;

const PauseSubscriptionModal = () => {
  const { isOpen, onClose, type } = useModalStore();
  const { t } = useTranslation();
  const isModalOpen = isOpen && type === "pauseSubscription";
  const { mutate: pauseSubscription, isPending: isPausing } =
    usePauseSubscription();

  const maxDate = addMonths(new Date(), 4);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      resumeDate: undefined,
    },
  });

  const handlePauseSubscription = (values: FormValues) => {
    const formattedDate = values.resumeDate.toISOString().split("T")[0];
    pauseSubscription(
      { resumeOn: formattedDate },
      {
        onSuccess: () => {
          onClose();
          form.reset();
        },
      },
    );
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={handleClose}
      backdrop="blur"
      placement="center"
      isDismissable={false}
      motionProps={{
        variants: {
          enter: {
            y: 0,
            opacity: 1,
            transition: {
              duration: 0.05,
            },
          },
          exit: {
            opacity: 0,
            transition: {
              duration: 0.05,
            },
          },
        },
      }}
      classNames={{
        backdrop: "bg-black/50 backdrop-blur-md",
        base: "bg-white rounded-lg dark:bg-neutral-950 py-1 w-full max-w-md",
        header: "border-b-0 mb-0 pb-0",
        footer: "border-t-0",
        closeButton:
          "hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:bg-transparent hover:text-primary p-1 right-2 top-2",
        body: "pt-0",
      }}
      portalContainer={document.body}
    >
      <ModalContent className="border">
        {() => (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handlePauseSubscription)}>
              <ModalHeader>{t("profile.pauseSubscription")}</ModalHeader>

              <ModalBody className="py-4 space-y-4">
                <p className="text-sm">
                  <span className="text-primary/80">
                    {t("profile.pauseSubscriptionInfo")}
                  </span>{" "}
                  <span className="text-black dark:text-white font-semibold">
                    {t("profile.pauseSubscriptionEligibility")}
                  </span>
                </p>

                <FormField
                  control={form.control}
                  name="resumeDate"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>
                        {t("profile.resumeSubscriptionDate")}
                      </FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          maxDate={maxDate}
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value
                          ? t("profile.willResumeOn")
                          : t("profile.selectRequiredDate")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </ModalBody>

              <ModalFooter className="gap-2">
                <Button type="button" variant="outline" onClick={handleClose}>
                  {t("accountDeleteModal.cancelButton")}
                </Button>
                <Button
                  type="submit"
                  disabled={isPausing}
                  className="flex items-center gap-2"
                >
                  {isPausing ? (
                    <Spinner />
                  ) : (
                    <>
                      <PauseCircle className="h-4 w-4" />
                      {t("profile.pauseNow")}
                    </>
                  )}
                </Button>
              </ModalFooter>
            </form>
          </Form>
        )}
      </ModalContent>
    </Modal>
  );
};

export default PauseSubscriptionModal;
