import React, { useEffect } from "react";
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { useModalStore } from "@/hooks/use-modal-store";
import { useTranslation } from "react-i18next";
import { useParams } from "next/navigation";
import {
  useCreateUserPrompt,
  useGetTier,
  useGetUserPrompts,
  useUpdateUser,
  useUserProfile,
} from "@/query-hooks/user";
import { useGetSummaryRanges } from "@/query-hooks/content";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { SummaryRange, UserSummaryPrompt } from "@/lib/types";
import { useGenerateSummaryMutation } from "@/query-hooks/generation";
import { Switch } from "@/components/ui/switch";
import { useGetContent } from "@/query-hooks/content";
import { isDocumentType } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import { formatMilliseconds } from "@/lib/utils";
import { TimestampInput } from "@/components/ui/timestamp-input";
import { useErrorStore } from "@/hooks/use-error-store";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const rangeSchema = z.object({
  start: z.number().min(0),
  end: z.number().min(0),
});

const SummaryCustomizeModal = () => {
  const params = useParams();
  const { isOpen, type, onClose } = useModalStore();
  const isModalOpen = isOpen && type === "summaryOptions";
  const { t } = useTranslation();
  const { data: userPrompts, isLoading: isLoadingPrompts } =
    useGetUserPrompts();
  const { data: summaryRanges, isLoading: isLoadingSummaryRanges } =
    useGetSummaryRanges(params.contentId as string);
  const { mutate: generateSummary, isPending: isGeneratingSummary } =
    useGenerateSummaryMutation();
  const { mutate: createPrompt, isPending: isCreatingPrompt } =
    useCreateUserPrompt();
  const { data: userProfile } = useUserProfile();
  const { mutate: updateUser, isPending: isUpdatingUser } = useUpdateUser();
  const { data: content } = useGetContent(
    params.spaceId as string,
    params.contentId as string,
  );
  const { data: tier } = useGetTier();
  const { openModal } = useErrorStore();

  const contentType = content?.type;
  const maxRangeLength = content?.length;

  const isDocument = contentType && isDocumentType(contentType);

  const formSchema = z.object({
    summaryPrompt: z.string(),
    newPromptName: z.string().optional(),
    newPromptContent: z.string().optional(),
    setAsDefault: z.boolean().default(true),
    rangeOption: z.enum(["default", "custom"]),
    rangeId: z.string().optional(),
    customRanges: z.array(rangeSchema).optional(),
  });

  type FormValues = z.infer<typeof formSchema>;

  const getDefaultSummaryType = (): string => {
    if (userProfile?.user_profile?.summary_preference === "custom") {
      return userProfile.user_profile.user_summary_prompt?.id || "detailed";
    }
    return "detailed";
  };

  const isDefaultPrompt = (promptId: string): boolean => {
    return getDefaultSummaryType() === promptId;
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      summaryPrompt: getDefaultSummaryType(),
      rangeOption: "default",
      setAsDefault: true,
      customRanges: [{ start: 0, end: maxRangeLength || 100 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "customRanges",
  });

  useEffect(() => {
    if (isModalOpen) {
      form.reset({
        summaryPrompt: getDefaultSummaryType(),
        rangeOption: "default",
        setAsDefault: true,
        newPromptName: undefined,
        newPromptContent: undefined,
        customRanges: [{ start: 0, end: maxRangeLength || 100 }],
      });
    }
  }, [isModalOpen, form, userProfile, maxRangeLength]);

  useEffect(() => {
    if (userProfile) {
      const defaultType = getDefaultSummaryType();
      if (
        defaultType === "detailed" ||
        userPrompts?.prompts?.some((p) => p._id === defaultType)
      ) {
        form.setValue("summaryPrompt", defaultType);
      }
    }
  }, [userProfile, userPrompts, form]);

  useEffect(() => {
    if (
      summaryRanges?.summary_ranges &&
      summaryRanges.summary_ranges.length > 0 &&
      form.watch("rangeOption") === "default" &&
      !form.watch("rangeId")
    ) {
      form.setValue("rangeId", summaryRanges.summary_ranges[0].id);
    }
  }, [summaryRanges, form]);

  const summaryPrompt = form.watch("summaryPrompt");
  const rangeOption = form.watch("rangeOption");
  const isSubmitting = isGeneratingSummary || isCreatingPrompt;

  const getCustomSummaryId = (
    values: FormValues,
    newPromptId?: string,
  ): string | undefined => {
    if (values.summaryPrompt === "detailed") {
      return undefined;
    }

    if (values.summaryPrompt === "new") {
      return newPromptId;
    }

    return values.summaryPrompt;
  };

  const getSummaryRanges = (values: FormValues): number[][] => {
    if (values.rangeOption === "custom") {
      if (values.customRanges && values.customRanges.length > 0) {
        return values.customRanges.map((range) => [range.start, range.end]);
      }
    } else if (values.rangeOption === "default" && values.rangeId) {
      const selectedRange = summaryRanges?.summary_ranges?.find(
        (range: SummaryRange) => range.id === values.rangeId,
      );
      return selectedRange?.range || [];
    }
    return [];
  };

  const generateSummaryWithParams = (
    contentId: string,
    customSummary?: string,
    summaryRanges?: number[][],
  ) => {
    generateSummary({
      contentId,
      customSummary,
      summaryRange: summaryRanges,
    });
    onClose();
  };

  const createPromptAndGenerateSummary = (values: FormValues) => {
    if (!values.newPromptName || !values.newPromptContent) return;

    createPrompt(
      {
        name: values.newPromptName,
        prompt: values.newPromptContent,
        setDefault: values.setAsDefault,
      },
      {
        onSuccess: (data) => {
          const customSummary = data._id;
          const summaryRanges = getSummaryRanges(values);

          generateSummaryWithParams(
            params.contentId as string,
            customSummary,
            summaryRanges,
          );
        },
      },
    );
  };

  const handleDetailedSummary = (values: FormValues) => {
    updateUser(
      {
        summaryPreference: "detailed",
      },
      {
        onSuccess: () => {
          const summaryRanges = getSummaryRanges(values);
          generateSummaryWithParams(
            params.contentId as string,
            undefined,
            summaryRanges,
          );
          onClose();
        },
      },
    );
  };

  const onSubmit = (values: FormValues) => {
    if (tier === "free") {
      openModal(
        {
          status: 402,
          statusText: "Upgrade to continue",
        },
        {
          source: "summary-customize-modal",
        },
      );
      onClose();
      return;
    }
    if (values.summaryPrompt === "detailed") {
      handleDetailedSummary(values);
      return;
    }
    if (values.summaryPrompt === "new") {
      createPromptAndGenerateSummary(values);
    } else {
      const customSummary = getCustomSummaryId(values);
      const summaryRanges = getSummaryRanges(values);
      generateSummaryWithParams(
        params.contentId as string,
        customSummary,
        summaryRanges,
      );
    }
  };

  const handleDialogClose = () => {
    form.reset();
    onClose();
  };

  const addNewRange = () => {
    append({ start: 0, end: maxRangeLength || 100 });
  };

  const handleDeletePrompt = (promptId: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("summary.personalize")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <Label>{t("summary.type")}</Label>
            <Controller
              name="summaryPrompt"
              control={form.control}
              render={({ field }) => (
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    if (value === "new") {
                      form.setValue("newPromptName", "");
                      form.setValue("newPromptContent", "");
                    }
                  }}
                  value={field.value}
                >
                  <SelectTrigger>
                    {field.value === "detailed"
                      ? t("summary.detailed")
                      : userPrompts?.prompts?.find(
                          (prompt) => prompt._id === field.value,
                        )?.name}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="detailed"
                      className="cursor-pointer hover:bg-accent rounded-sm"
                    >
                      {t("summary.detailed")}{" "}
                      {isDefaultPrompt("detailed") && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({t("summary.default")})
                        </span>
                      )}
                    </SelectItem>
                    {!isLoadingPrompts &&
                      userPrompts?.prompts?.map((prompt: UserSummaryPrompt) => (
                        <TooltipProvider delayDuration={100} key={prompt._id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <SelectItem
                                value={prompt._id}
                                className="cursor-pointer hover:bg-accent rounded-sm w-full relative pr-8"
                              >
                                <span>
                                  {prompt.name}
                                  {isDefaultPrompt(prompt._id) && (
                                    <span className="ml-1 text-xs text-muted-foreground">
                                      ({t("summary.default")})
                                    </span>
                                  )}
                                </span>
                              </SelectItem>
                            </TooltipTrigger>
                            {prompt.prompt && (
                              <TooltipContent>{prompt.prompt}</TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    <SelectItem
                      value="new"
                      className="cursor-pointer hover:bg-accent rounded-sm"
                    >
                      <div className="flex items-center">
                        <Plus className="h-4 w-4 mr-2" />
                        {t("summary.addCustomPrompt")}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />

            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="setAsDefault"
                checked={form.watch("setAsDefault")}
                onCheckedChange={(checked) =>
                  form.setValue("setAsDefault", checked)
                }
              />
              <Label htmlFor="setAsDefault" className="cursor-pointer">
                {t("summary.setAsDefault")}
              </Label>
            </div>
          </div>

          {summaryPrompt === "new" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="newPromptName">{t("summary.promptName")}</Label>
                <Input
                  id="newPromptName"
                  {...form.register("newPromptName")}
                  className="mt-1"
                  placeholder={t("summary.enterPromptName")}
                />
              </div>
              <div>
                <Label htmlFor="newPromptContent">
                  {t("summary.promptContent")}
                </Label>
                <Textarea
                  id="newPromptContent"
                  {...form.register("newPromptContent")}
                  className="mt-1 p-2"
                  placeholder={t("summary.enterCustomDescription")}
                  rows={4}
                />
              </div>
            </div>
          )}

          <div className="space-y-4">
            <Label>{t("summary.range")}</Label>
            <Controller
              name="rangeOption"
              control={form.control}
              render={({ field }) => (
                <RadioGroup
                  onValueChange={(value) => {
                    field.onChange(value);
                    if (value === "custom") {
                      form.setValue("rangeId", undefined);
                    } else if (
                      value === "default" &&
                      summaryRanges?.summary_ranges &&
                      summaryRanges.summary_ranges.length > 0
                    ) {
                      form.setValue(
                        "rangeId",
                        summaryRanges.summary_ranges[0].id,
                      );
                    }
                  }}
                  value={field.value}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="default" id="default-range" />
                    <Label htmlFor="default-range">
                      {t("summary.useExistingRange")}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="custom-range" />
                    <Label htmlFor="custom-range">
                      {t("summary.createCustomRanges")}
                    </Label>
                  </div>
                </RadioGroup>
              )}
            />

            {rangeOption === "default" && (
              <div className="mt-2">
                <Controller
                  name="rangeId"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("summary.selectRange")} />
                      </SelectTrigger>
                      <SelectContent>
                        {!isLoadingSummaryRanges &&
                          summaryRanges?.summary_ranges?.map(
                            (range: SummaryRange) => {
                              return (
                                <SelectItem
                                  key={range.id}
                                  value={range.id}
                                  className="cursor-pointer hover:bg-accent rounded-sm"
                                >
                                  {range.range && range.range.length === 0
                                    ? isDocument
                                      ? t("summary.fullDocument")
                                      : t("summary.all")
                                    : range.range
                                      ? isDocument
                                        ? Array.isArray(range.range) &&
                                          range.range.length >= 2
                                          ? `${range.range[0]} - ${range.range[1]}`
                                          : `${range.range}`
                                        : Array.isArray(range.range[0])
                                          ? range.range
                                              .map((timeRange) => {
                                                if (
                                                  Array.isArray(timeRange) &&
                                                  timeRange.length >= 2
                                                ) {
                                                  return `${formatMilliseconds(timeRange[0])} - ${formatMilliseconds(timeRange[1])}`;
                                                }
                                                return "";
                                              })
                                              .filter(Boolean)
                                              .join(", ")
                                          : Array.isArray(range.range) &&
                                              range.range.length >= 2
                                            ? `${formatMilliseconds(Number(range.range[0]))} - ${formatMilliseconds(Number(range.range[1]))}`
                                            : "00:00 - 00:00"
                                      : "00:00 - 00:00"}
                                </SelectItem>
                              );
                            },
                          )}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}

            {rangeOption === "custom" && (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>
                        {t("summary.rangeNumber", { number: index + 1 })}
                      </Label>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <Label htmlFor={`customRanges.${index}.start`}>
                          {t("summary.start")}
                        </Label>
                        {isDocument ? (
                          <Input
                            id={`customRanges.${index}.start`}
                            type="number"
                            min="0"
                            max={maxRangeLength}
                            {...form.register(`customRanges.${index}.start`, {
                              valueAsNumber: true,
                            })}
                          />
                        ) : (
                          <Controller
                            name={`customRanges.${index}.start`}
                            control={form.control}
                            render={({ field }) => (
                              <TimestampInput
                                id={`customRanges.${index}.start`}
                                value={field.value}
                                onChange={field.onChange}
                                maxValue={maxRangeLength}
                              />
                            )}
                          />
                        )}
                      </div>
                      <span className="mt-6">to</span>
                      <div className="flex-1">
                        <Label htmlFor={`customRanges.${index}.end`}>
                          {t("summary.end")}
                        </Label>
                        {isDocument ? (
                          <Input
                            id={`customRanges.${index}.end`}
                            type="number"
                            min="0"
                            max={maxRangeLength}
                            {...form.register(`customRanges.${index}.end`, {
                              valueAsNumber: true,
                            })}
                          />
                        ) : (
                          <Controller
                            name={`customRanges.${index}.end`}
                            control={form.control}
                            render={({ field }) => (
                              <TimestampInput
                                id={`customRanges.${index}.end`}
                                value={field.value}
                                onChange={field.onChange}
                                maxValue={maxRangeLength}
                              />
                            )}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addNewRange}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("summary.addAnotherRange")}
                </Button>

                <div className="text-xs text-muted-foreground">
                  {t("summary.maximumRange", {
                    min: isDocument ? 0 : formatMilliseconds(0),
                    max: isDocument
                      ? maxRangeLength
                      : formatMilliseconds(maxRangeLength as number),
                  })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={handleDialogClose}
              disabled={isSubmitting}
            >
              {t("summary.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("summary.generating") : t("summary.generate")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SummaryCustomizeModal;
