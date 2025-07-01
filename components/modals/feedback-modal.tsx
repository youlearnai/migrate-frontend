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
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useModalStore } from "@/hooks/use-modal-store";
import { useGetFeedback } from "@/query-hooks/user";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

const FeedbackModal = () => {
  const { t } = useTranslation();
  const { isOpen, onClose, type, onOpen } = useModalStore();
  const isModalOpen = isOpen && type === "feedback";
  const { mutate: getFeedback, isPending } = useGetFeedback();
  const router = useRouter();

  const [showSurvey, setShowSurvey] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 7;

  const formSchema = z
    .object({
      disappointmentLevel: z.string({
        required_error: t("feedbackModal.validation.disappointmentLevel"),
      }),
      wouldUseAlternative: z.boolean({
        required_error: t("feedbackModal.validation.wouldUseAlternative"),
      }),
      alternative: z.string().optional(),
      primaryBenefit: z
        .string()
        .min(1, t("feedbackModal.validation.primaryBenefit")),
      hasRecommended: z.boolean({
        required_error: t("feedbackModal.validation.hasRecommended"),
      }),
      recommendationDetails: z.string().optional(),
      idealUserType: z
        .string()
        .min(1, t("feedbackModal.validation.primaryBenefit")),
      improvements: z
        .string()
        .min(1, t("feedbackModal.validation.primaryBenefit")),
      canFollowUp: z.boolean({
        required_error: t("feedbackModal.validation.canFollowUp"),
      }),
    })
    .superRefine((data, ctx) => {
      if (
        data.wouldUseAlternative &&
        (!data.alternative || data.alternative.length < 1)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("feedbackModal.validation.primaryBenefit"),
          path: ["alternative"],
        });
      }
      if (
        data.hasRecommended &&
        (!data.recommendationDetails || data.recommendationDetails.length < 1)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("feedbackModal.validation.primaryBenefit"),
          path: ["recommendationDetails"],
        });
      }
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      disappointmentLevel: undefined,
      wouldUseAlternative: undefined,
      alternative: undefined,
      primaryBenefit: undefined,
      hasRecommended: undefined,
      recommendationDetails: undefined,
      idealUserType: undefined,
      improvements: undefined,
      canFollowUp: undefined,
    },
  });

  const handleNext = async () => {
    let isValid = false;

    switch (step) {
      case 1:
        isValid = await form.trigger("disappointmentLevel");
        break;
      case 2:
        isValid = await form.trigger("wouldUseAlternative");
        if (isValid && form.getValues("wouldUseAlternative")) {
          isValid = await form.trigger("alternative");
          if (isValid && !form.getValues("alternative")) {
            isValid = false;
          }
        }
        break;
      case 3:
        isValid = await form.trigger("primaryBenefit");
        break;
      case 4:
        isValid = await form.trigger("hasRecommended");
        if (isValid && form.getValues("hasRecommended")) {
          isValid = await form.trigger("recommendationDetails");
          if (isValid && !form.getValues("recommendationDetails")) {
            isValid = false;
          }
        }
        break;
      case 5:
        isValid = await form.trigger("idealUserType");
        break;
      case 6:
        isValid = await form.trigger("improvements");
        break;
      case 7:
        isValid = await form.trigger("canFollowUp");
        break;
      default:
        isValid = true;
    }

    if (isValid) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    const isValid = await form.trigger("canFollowUp");
    if (isValid) {
      form.handleSubmit(onSubmit)();
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const shouldSchedule = values.canFollowUp;
    getFeedback(values, {
      onSuccess: () => {
        form.reset();
        toast.success(t("contact.form.submitSuccess"));
        localStorage.setItem("feedbackCompleted", "true");
        router.refresh();
        if (shouldSchedule) {
          onOpen("schedule", {
            calLink: "/youlearn/youlearn-customer-insights-session",
            scheduleDescription: t("feedbackModal.scheduleDescription"),
          });
        }
      },
    });
    onClose();
  };

  const renderStep = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        return (
          <FormField
            control={form.control}
            name="disappointmentLevel"
            render={({ field }) => (
              <FormItem className="space-y-4">
                <FormLabel className="text-lg">
                  {t("feedbackModal.disappointmentQuestion")}
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex flex-col space-y-2"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="very" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        {t("feedbackModal.disappointmentAnswers.very")}
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="somewhat" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        {t("feedbackModal.disappointmentAnswers.somewhat")}
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="not" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        {t("feedbackModal.disappointmentAnswers.not")}
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="na" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        {t("feedbackModal.disappointmentAnswers.na")}
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 2:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="wouldUseAlternative"
              render={({ field }) => (
                <FormItem className="space-y-4">
                  <FormLabel className="text-lg">
                    {t("feedbackModal.alternativeQuestion")}
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={
                        field.value === true
                          ? "true"
                          : field.value === false
                            ? "false"
                            : ""
                      }
                      onValueChange={(value) =>
                        field.onChange(value === "true")
                      }
                      className="flex flex-col space-y-2"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="false" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {t("feedbackModal.alternativeAnswers.no")}
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="true" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {t("feedbackModal.alternativeAnswers.yes")}
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("wouldUseAlternative") && (
              <FormField
                control={form.control}
                name="alternative"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("feedbackModal.whichAlternative")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t(
                          "feedbackModal.placeholders.enterAlternative",
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        );

      case 3:
        return (
          <FormField
            control={form.control}
            name="primaryBenefit"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg">
                  {t("feedbackModal.primaryBenefitQuestion")}
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder={t("feedbackModal.placeholders.typeAnswerHere")}
                    className="p-4 min-h-[56px] max-h-[56px] resize-none"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 4:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="hasRecommended"
              render={({ field }) => (
                <FormItem className="space-y-4">
                  <FormLabel className="text-lg">
                    {t("feedbackModal.recommendedQuestion")}
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={
                        field.value === true
                          ? "true"
                          : field.value === false
                            ? "false"
                            : ""
                      }
                      onValueChange={(value) =>
                        field.onChange(value === "true")
                      }
                      className="flex flex-col space-y-2"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="false" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {t("feedbackModal.recommendationAnswers.no")}
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="true" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {t("feedbackModal.recommendationAnswers.yes")}
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("hasRecommended") && (
              <FormField
                control={form.control}
                name="recommendationDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("feedbackModal.recommendationDetails")}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={t(
                          "feedbackModal.placeholders.typeAnswerHere",
                        )}
                        className="p-4 min-h-[56px] max-h-[56px] resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        );

      case 5:
        return (
          <FormField
            key="idealUserType"
            control={form.control}
            name="idealUserType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg">
                  {t("feedbackModal.idealUserTypeQuestion")}
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder={t("feedbackModal.placeholders.typeAnswerHere")}
                    className="p-4 min-h-[56px] max-h-[56px] resize-none"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 6:
        return (
          <FormField
            key="improvements"
            control={form.control}
            name="improvements"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg">
                  {t("feedbackModal.improvementsQuestion")}
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder={t("feedbackModal.placeholders.typeAnswerHere")}
                    className="p-4 min-h-[56px] max-h-[56px] resize-none"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 7:
        return (
          <FormField
            control={form.control}
            name="canFollowUp"
            render={({ field }) => (
              <FormItem className="space-y-4">
                <FormLabel className="text-lg">
                  {t("feedbackModal.followUpQuestion")}
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    value={
                      field.value === true
                        ? "yes"
                        : field.value === false
                          ? "no"
                          : ""
                    }
                    onValueChange={(value) => field.onChange(value === "yes")}
                    className="flex flex-col space-y-2"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="yes" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        {t("feedbackModal.followUpAnswers.yes")}
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="no" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        {t("feedbackModal.followUpAnswers.no")}
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
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

  if (!showSurvey) {
    return (
      <Dialog open={isModalOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-medium">
              {t("feedbackModal.title")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("feedbackModal.introMessage")}
            </p>
          </div>

          <DialogFooter className="flex space-x-2 gap-2 sm:gap-0">
            <Button variant="outline" onClick={onClose}>
              {t("feedbackModal.maybeLater")}
            </Button>
            <Button onClick={() => setShowSurvey(true)}>
              {t("feedbackModal.start")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xs font-medium text-muted-foreground">
            {t("feedbackModal.stepIndicator", { step, totalSteps })}
          </DialogTitle>
          <div className="w-full bg-primary/20 h-1 rounded-full mt-2">
            <div
              className="bg-primary h-1 rounded-full transition-all"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {renderStep(step)}

            <DialogFooter className="gap-2 sm:gap-0">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                >
                  {t("feedbackModal.buttons.previous")}
                </Button>
              )}
              {step < totalSteps ? (
                <Button type="button" onClick={handleNext}>
                  {t("feedbackModal.buttons.next")}
                </Button>
              ) : (
                <Button
                  disabled={isPending}
                  type="button"
                  onClick={handleSubmit}
                >
                  {t("feedbackModal.buttons.submit")}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackModal;
