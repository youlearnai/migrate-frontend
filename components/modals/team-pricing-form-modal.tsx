import { useModalStore } from "@/hooks/use-modal-store";
import React from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@nextui-org/modal";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitTeamPricingForm } from "@/query-hooks/user";
import { toast } from "sonner";

const formSchema = z.object({
  companyName: z.string().min(1, { message: "Organization name is required" }),
  teamMembers: z.coerce
    .number()
    .min(1, { message: "Must have at least 1 team member" }),
  message: z.string().min(1, { message: "Please describe your needs" }),
});

export type TeamPricingFormData = z.infer<typeof formSchema>;

const TeamPricingFormModal = () => {
  const { t } = useTranslation();
  const { type, isOpen, onClose } = useModalStore();
  const isModalOpen = isOpen && type === "teamPricingFormModal";
  const { mutate: submitTeamPricingForm, isPending } =
    useSubmitTeamPricingForm();

  const form = useForm<TeamPricingFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      teamMembers: 1,
      message: "",
    },
  });

  const onSubmit = (data: TeamPricingFormData) => {
    submitTeamPricingForm(data, {
      onSuccess: () => {
        toast.success(t("contact.form.submitSuccess"));
        form.reset();
        onClose();
      },
    });
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
      motionProps={{
        variants: {
          enter: {
            y: 0,
            opacity: 1,
            transition: {
              duration: 0.3,
              ease: "easeOut",
            },
          },
          exit: {
            y: -20,
            opacity: 0,
            transition: {
              duration: 0.2,
              ease: "easeIn",
            },
          },
        },
      }}
      classNames={{
        backdrop: "bg-black/50 backdrop-blur-md",
        base: "bg-white dark:bg-neutral-950 py-1 w-full sm:max-w-2xl",
        header: "border-b-0 mb-0 pb-0",
        footer: "border-t-0",
        closeButton:
          "hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:bg-transparent hover:text-primary p-1 right-2 top-2",
        body: "pt-0",
      }}
    >
      <ModalContent className="rounded-lg border">
        {(onClose) => (
          <>
            <ModalHeader className="text-xl mb-1 font-normal">
              {t("teamPricingForm.title", "Contact Us for Team Plan")}
            </ModalHeader>

            <ModalBody className="pb-6">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6 pt-2"
                >
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("teamPricingForm.companyName", "Company Name")}
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="YouLearn Inc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="teamMembers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t(
                            "teamPricingForm.teamMembers",
                            "Number of Team Members",
                          )}
                        </FormLabel>
                        <FormControl>
                          <Input type="number" min={1} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t(
                            "teamPricingForm.message",
                            "What are your specific needs or requirements?",
                          )}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t(
                              "teamPricingForm.messagePlaceholder",
                              "e.g. We need a plan for 100 team members",
                            )}
                            rows={4}
                            className="p-3 min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col gap-2.5">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isPending}
                    >
                      {t("contact.form.submit", "Submit")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={onClose}
                    >
                      {t("accountDeleteModal.cancelButton", "Cancel")}
                    </Button>
                  </div>
                </form>
              </Form>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default TeamPricingFormModal;
