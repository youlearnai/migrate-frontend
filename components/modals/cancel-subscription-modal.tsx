import React, { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";
import { useModalStore } from "@/hooks/use-modal-store";
import { useCancelSubscriptionForm, usePortalLink } from "@/query-hooks/user";
import { useRouter } from "next/navigation";
import { Settings, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/modal";

const formSchema = z
  .object({
    primaryReason: z.enum([
      "switchingPlatform",
      "dontUseEnough",
      "evaluating",
      "notUseful",
      "tooExpensive",
      "other",
    ]),
    otherReason: z.string().optional(),
    switchingPlatformDetails: z.string().optional(),
    dontUseEnoughDetails: z.string().optional(),
    evaluatingDetails: z.string().optional(),
    notUsefulDetails: z.string().optional(),
    tooExpensiveDetails: z.string().optional(),
    additionalFeedback: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.primaryReason === "other" &&
      (!data.otherReason || data.otherReason.trim() === "")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please specify your reason",
        path: ["otherReason"],
      });
    }

    if (
      data.primaryReason === "switchingPlatform" &&
      (!data.switchingPlatformDetails ||
        data.switchingPlatformDetails.trim() === "")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please specify which platform you're switching to",
        path: ["switchingPlatformDetails"],
      });
    }

    if (
      data.primaryReason === "dontUseEnough" &&
      (!data.dontUseEnoughDetails || data.dontUseEnoughDetails.trim() === "")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please provide more details",
        path: ["dontUseEnoughDetails"],
      });
    }

    if (
      data.primaryReason === "evaluating" &&
      (!data.evaluatingDetails || data.evaluatingDetails.trim() === "")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please provide details on what you're comparing against",
        path: ["evaluatingDetails"],
      });
    }

    if (
      data.primaryReason === "notUseful" &&
      (!data.notUsefulDetails || data.notUsefulDetails.trim() === "")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please provide more details on what features were missing",
        path: ["notUsefulDetails"],
      });
    }

    if (
      data.primaryReason === "tooExpensive" &&
      (!data.tooExpensiveDetails || data.tooExpensiveDetails.trim() === "")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please provide details on what price would be acceptable",
        path: ["tooExpensiveDetails"],
      });
    }
  });

const CancelSubscriptionModal = () => {
  const { t } = useTranslation();
  const { type, isOpen, onClose } = useModalStore();
  const { mutate: getPortal, isPending: isPortalLoading } = usePortalLink();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const totalSteps = 2;
  const {
    mutate: cancelSubscriptionForm,
    isPending: isCancelSubscriptionFormSubmitting,
  } = useCancelSubscriptionForm();

  const isCancelModal = type === "cancelSubscriptionModal" && isOpen;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      primaryReason: undefined,
      otherReason: "",
      switchingPlatformDetails: "",
      dontUseEnoughDetails: "",
      evaluatingDetails: "",
      notUsefulDetails: "",
      tooExpensiveDetails: "",
      additionalFeedback: "",
    },
    mode: "onChange",
  });

  const cancelReasonOptions = [
    {
      value: "switchingPlatform",
      key: "profile.switchingPlatform",
      defaultText: "I'm switching to a different platform",
    },
    {
      value: "dontUseEnough",
      key: "profile.dontUseEnough",
      defaultText: "I don't use it enough",
    },
    {
      value: "evaluating",
      key: "profile.evaluating",
      defaultText: "I am still evaluating and just want to turn off auto-renew",
    },
    {
      value: "notUseful",
      key: "profile.notUseful",
      defaultText: "It is not useful enough",
    },
    {
      value: "tooExpensive",
      key: "profile.tooExpensive",
      defaultText: "It is too expensive",
    },
    {
      value: "other",
      key: "profile.other",
      defaultText: "Other (please specify)",
    },
  ];

  const handleFeedbackSubmit = async (values: z.infer<typeof formSchema>) => {
    // Validate all fields
    const isValid = await form.trigger();

    if (!isValid) {
      // Check which step contains validation errors
      const errors = form.formState.errors;

      if (errors.primaryReason || errors.otherReason) {
        setStep(1);
        return;
      }

      return;
    }

    // Only proceed if validation passes
    cancelSubscriptionForm(values, {
      onSuccess: () => {
        toast.success(
          t(
            "profile.cancellationSurveySuccess",
            "Cancellation survey submitted successfully.",
          ),
        );
        handleProceedToCancel();
      },
      onError: () => {
        toast.error(
          t(
            "profile.cancellationSurveyError",
            "Failed to submit cancellation survey.",
          ),
        );
      },
    });
  };

  const handleNext = async () => {
    let isValid = false;

    switch (step) {
      case 1:
        isValid = await form.trigger("primaryReason");
        if (form.getValues().primaryReason === "other") {
          isValid = (await form.trigger("otherReason")) && isValid;
        }
        if (form.getValues().primaryReason === "switchingPlatform") {
          isValid = (await form.trigger("switchingPlatformDetails")) && isValid;
        }
        if (form.getValues().primaryReason === "dontUseEnough") {
          isValid = (await form.trigger("dontUseEnoughDetails")) && isValid;
        }
        if (form.getValues().primaryReason === "evaluating") {
          isValid = (await form.trigger("evaluatingDetails")) && isValid;
        }
        if (form.getValues().primaryReason === "notUseful") {
          isValid = (await form.trigger("notUsefulDetails")) && isValid;
        }
        if (form.getValues().primaryReason === "tooExpensive") {
          isValid = (await form.trigger("tooExpensiveDetails")) && isValid;
        }
        break;
      default:
        isValid = true;
    }

    if (isValid) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

  const handleProceedToCancel = () => {
    getPortal(undefined, {
      onSuccess: (data) => {
        router.push(data?.url!);
        form.reset();
        setStep(1);
        onClose();
      },
      onError: () => {
        console.error("Failed to get portal link.");
        toast.error(
          t(
            "profile.portalLinkError",
            "Could not load subscription management page.",
          ),
        );
      },
    });
  };

  const handleClose = () => {
    form.reset();
    setStep(1);
    onClose();
  };

  const renderStep = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="primaryReason"
              render={({ field }) => (
                <FormItem className="space-y-4">
                  <FormLabel className="text-lg">
                    {t(
                      "profile.primaryReason",
                      "What was the primary reason for canceling your subscription?",
                    )}{" "}
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-col space-y-2"
                    >
                      {cancelReasonOptions.map((option) => (
                        <FormItem
                          key={option.value}
                          className="flex items-center space-x-3 space-y-0"
                        >
                          <FormControl>
                            <RadioGroupItem value={option.value} />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {t(option.key, option.defaultText)}
                          </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("primaryReason") === "other" && (
              <FormField
                control={form.control}
                name="otherReason"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel className="text-base">
                      {t(
                        "profile.pleaseSpecifyReason",
                        "Please specify your reason:",
                      )}{" "}
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        className="p-3 min-h-[56px] resize-none"
                        placeholder={t(
                          "profile.pleaseSpecifyReason",
                          "Please specify your reason...",
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {form.watch("primaryReason") === "switchingPlatform" && (
              <FormField
                control={form.control}
                name="switchingPlatformDetails"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel className="text-base">
                      {t(
                        "profile.switchingPlatformDetails",
                        "Which platform are you switching to?",
                      )}{" "}
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        className="p-3 min-h-[56px] resize-none"
                        placeholder={t(
                          "profile.switchingPlatformPlaceholder",
                          "Please name the platform you're switching to...",
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {form.watch("primaryReason") === "dontUseEnough" && (
              <FormField
                control={form.control}
                name="dontUseEnoughDetails"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel className="text-base">
                      {t(
                        "profile.dontUseEnoughDetails",
                        "What would encourage you to use it more?",
                      )}{" "}
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        className="p-3 min-h-[56px] resize-none"
                        placeholder={t(
                          "profile.dontUseEnoughPlaceholder",
                          "Please provide more details...",
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {form.watch("primaryReason") === "evaluating" && (
              <FormField
                control={form.control}
                name="evaluatingDetails"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel className="text-base">
                      {t(
                        "profile.evaluatingDetails",
                        "What are you comparing us against, or what would help you feel confident choosing us?",
                      )}{" "}
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        className="p-3 min-h-[56px] resize-none"
                        placeholder={t(
                          "profile.evaluatingPlaceholder",
                          "Please share what alternatives you're considering or what would help you decide...",
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {form.watch("primaryReason") === "notUseful" && (
              <FormField
                control={form.control}
                name="notUsefulDetails"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel className="text-base">
                      {t(
                        "profile.notUsefulDetails",
                        "What features were you expecting but missing?",
                      )}{" "}
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        className="p-3 min-h-[56px] resize-none"
                        placeholder={t(
                          "profile.notUsefulPlaceholder",
                          "Please describe the features you were looking for...",
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {form.watch("primaryReason") === "tooExpensive" && (
              <FormField
                control={form.control}
                name="tooExpensiveDetails"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel className="text-base">
                      {t(
                        "profile.tooExpensiveDetails",
                        "What price would you consider reasonable?",
                      )}{" "}
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        className="p-3 min-h-[56px] resize-none"
                        placeholder={t(
                          "profile.tooExpensivePlaceholder",
                          "Please provide your price expectations...",
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        );
      case 2:
        return (
          <FormField
            control={form.control}
            name="additionalFeedback"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">
                  {t(
                    "profile.additionalFeedback",
                    "Is there anything else you would like the team to know?",
                  )}
                </FormLabel>
                <FormControl>
                  <Textarea
                    className="p-3 min-h-[56px] resize-none"
                    placeholder={t(
                      "profile.yourSuggestions",
                      "Your suggestions are valuable to us...",
                    )}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isCancelModal}
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
        base: "bg-white dark:bg-neutral-950 py-1 w-full max-w-2xl",
        header: "border-b-0 mb-0 pb-0",
        footer: "border-t-0",
        closeButton:
          "hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:bg-transparent hover:text-primary p-1 right-2 top-2",
        body: "pt-0",
      }}
    >
      <ModalContent className="rounded-xl border">
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col">
              <div className="text-xs font-medium text-muted-foreground flex items-center gap-3">
                <Settings className="w-4 h-4" />
                <span>
                  {t("profile.cancellationSurvey", "Cancellation Survey")}
                </span>{" "}
                -{" "}
                <span>
                  {t("feedbackModal.stepIndicator", {
                    step: step,
                    totalSteps: totalSteps,
                  })}
                </span>
              </div>
              <div className="w-full bg-primary/20 h-1 rounded-full mt-2">
                <div
                  className="bg-primary h-1 rounded-full transition-all"
                  style={{ width: `${(step / totalSteps) * 100}%` }}
                />
              </div>
            </ModalHeader>

            <ModalBody className="pt-4">
              <Form {...form}>
                <form className="space-y-6">{renderStep(step)}</form>
              </Form>
            </ModalBody>

            <ModalFooter className="gap-2">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                >
                  {t("feedbackModal.buttons.previous", "Previous")}
                </Button>
              )}

              {step < totalSteps ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!form.watch("primaryReason")}
                >
                  {t("feedbackModal.buttons.next", "Next")}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={form.handleSubmit(handleFeedbackSubmit)}
                  disabled={isCancelSubscriptionFormSubmitting}
                >
                  {isCancelSubscriptionFormSubmitting
                    ? t("common.submitting", "Submitting...")
                    : t("feedbackModal.buttons.submit", "Submit")}
                </Button>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default CancelSubscriptionModal;
