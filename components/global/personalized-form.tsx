"use client";
import { PersonalizedFormSkeleton } from "@/components/skeleton/personalized-form-skeleton";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useAuth from "@/hooks/use-auth";
import { useLanguageOptions } from "@/lib/constants";
import { PersonalizedFormProps } from "@/lib/types";
import { useUser } from "@/query-hooks/user";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useGetTier } from "@/query-hooks/user";
import { useEducationOptions } from "@/lib/constants";
import { aiModelsOptions } from "@/lib/utils";
import AiModelDropdown from "../learn/ai-model-dropdown";
import { cn } from "@/lib/utils";

const FormSchema = z.object({
  name: z.string().min(3, "Please enter your name with at least 3 characters"),
  language: z.string().min(1, "Please select the language"),
  purpose: z.string().optional(),
  purposeDetail: z.string().optional(),
  referralSource: z.string().optional(),
  otherReferralSource: z.string().optional(),
  aiModel: z.string().min(1, "Please select an AI model"),
});

// Schema for non-profile pages where purpose/referral are required
const NonProfileFormSchema = FormSchema.extend({
  purpose: z.string().min(1, "Please select your purpose"),
  purposeDetail: z.string().min(1, "Please select your specific goal"),
  referralSource: z.string().min(1, "Please select a referral source"),
  otherReferralSource: z.string().optional(),
}).refine(
  (data) => {
    if (
      data.referralSource === "other" ||
      data.referralSource === "otherSocial"
    ) {
      return (
        data.otherReferralSource && data.otherReferralSource.trim().length > 0
      );
    }
    return true;
  },
  {
    message: "Please specify how you heard about us",
    path: ["otherReferralSource"],
  },
);

export type PersonalizedFormSchemaType = z.infer<typeof FormSchema>;

export default function PersonalizedForm({
  handleSubmit,
  isNewUser,
}: PersonalizedFormProps) {
  const { i18n, t } = useTranslation();
  const currentLocale = i18n.language;
  const router = useRouter();
  const currentPathname = usePathname();
  const { data: user, isLoading } = useUser();
  const languageOptions = useLanguageOptions();
  const { user: authUser, loading: authLoading } = useAuth();
  const { data: tier } = useGetTier();
  const educationOptions = useEducationOptions();
  const isProfilePage = currentPathname.includes("/profile");

  const purposeOptions = [
    {
      value: "work",
      label: (
        <span key="translation-purpose-work">
          {t("personalizedForm.purpose.work")}
        </span>
      ),
    },
    {
      value: "study",
      label: (
        <span key="translation-purpose-study">
          {t("personalizedForm.purpose.study")}
        </span>
      ),
    },
    {
      value: "personal",
      label: (
        <span key="translation-purpose-personal">
          {t("personalizedForm.purpose.personal")}
        </span>
      ),
    },
    {
      value: "teacher",
      label: (
        <span key="translation-purpose-teacher">
          {t("personalizedForm.purpose.teacher")}
        </span>
      ),
    },
  ];

  const referralOptions = [
    {
      value: "search",
      label: (
        <span key="translation-referral-search">
          {t("personalizedForm.referral.search")}
        </span>
      ),
    },
    {
      value: "instagram",
      label: (
        <span key="translation-referral-instagram">
          {t("personalizedForm.referral.instagram")}
        </span>
      ),
    },
    {
      value: "facebook",
      label: (
        <span key="translation-referral-facebook">
          {t("personalizedForm.referral.facebook")}
        </span>
      ),
    },
    {
      value: "pinterest",
      label: (
        <span key="translation-referral-pinterest">
          {t("personalizedForm.referral.pinterest")}
        </span>
      ),
    },
    {
      value: "tiktok",
      label: (
        <span key="translation-referral-tiktok">
          {t("personalizedForm.referral.tiktok")}
        </span>
      ),
    },
    {
      value: "youtube",
      label: (
        <span key="translation-referral-youtube">
          {t("personalizedForm.referral.youtube")}
        </span>
      ),
    },
    {
      value: "twitter",
      label: (
        <span key="translation-referral-twitter">
          {t("personalizedForm.referral.twitter")}
        </span>
      ),
    },
    {
      value: "telegram",
      label: (
        <span key="translation-referral-telegram">
          {t("personalizedForm.referral.telegram")}
        </span>
      ),
    },
    {
      value: "chatgpt",
      label: (
        <span key="translation-referral-chatgpt">
          {t("personalizedForm.referral.chatgpt")}
        </span>
      ),
    },
    {
      value: "otherSocial",
      label: (
        <span key="translation-referral-otherSocial">
          {t("personalizedForm.referral.otherSocial")}
        </span>
      ),
    },
    {
      value: "friend",
      label: (
        <span key="translation-referral-friend">
          {t("personalizedForm.referral.friend")}
        </span>
      ),
    },
    {
      value: "ad",
      label: (
        <span key="translation-referral-ad">
          {t("personalizedForm.referral.ad")}
        </span>
      ),
    },
    {
      value: "event",
      label: (
        <span key="translation-referral-event">
          {t("personalizedForm.referral.event")}
        </span>
      ),
    },
    {
      value: "blog",
      label: (
        <span key="translation-referral-blog">
          {t("personalizedForm.referral.blog")}
        </span>
      ),
    },
    {
      value: "other",
      label: (
        <span key="translation-referral-other">
          {t("personalizedForm.referral.other")}
        </span>
      ),
    },
  ];

  const purposeDetailOptions = {
    work: {
      question: t("personalizedForm2.purposeDetail.work.question"),
      options: [
        {
          key: "upskill",
          label: t("personalizedForm2.purposeDetail.work.options.upskill"),
        },
        {
          key: "transition",
          label: t("personalizedForm2.purposeDetail.work.options.transition"),
        },
        {
          key: "certification",
          label: t(
            "personalizedForm2.purposeDetail.work.options.certification",
          ),
        },
        {
          key: "other",
          label: t("personalizedForm2.purposeDetail.work.options.other"),
        },
      ],
    },
    study: {
      question: t("personalizedForm2.purposeDetail.study.question"),
      options: [
        {
          key: "exams",
          label: t("personalizedForm2.purposeDetail.study.options.exams"),
        },
        {
          key: "coursework",
          label: t("personalizedForm2.purposeDetail.study.options.coursework"),
        },
        {
          key: "research",
          label: t("personalizedForm2.purposeDetail.study.options.research"),
        },
        {
          key: "other",
          label: t("personalizedForm2.purposeDetail.study.options.other"),
        },
      ],
    },
    personal: {
      question: t("personalizedForm2.purposeDetail.personal.question"),
      options: [
        {
          key: "hobby",
          label: t("personalizedForm2.purposeDetail.personal.options.hobby"),
        },
        {
          key: "improvement",
          label: t(
            "personalizedForm2.purposeDetail.personal.options.improvement",
          ),
        },
        {
          key: "curiosity",
          label: t(
            "personalizedForm2.purposeDetail.personal.options.curiosity",
          ),
        },
        {
          key: "other",
          label: t("personalizedForm2.purposeDetail.personal.options.other"),
        },
      ],
    },
    teacher: {
      question: t("personalizedForm2.purposeDetail.teacher.question"),
      options: [
        {
          key: "lessons",
          label: t("personalizedForm2.purposeDetail.teacher.options.lessons"),
        },
        {
          key: "development",
          label: t(
            "personalizedForm2.purposeDetail.teacher.options.development",
          ),
        },
        {
          key: "engagement",
          label: t(
            "personalizedForm2.purposeDetail.teacher.options.engagement",
          ),
        },
        {
          key: "other",
          label: t("personalizedForm2.purposeDetail.teacher.options.other"),
        },
      ],
    },
  } as const;

  // Find the language option that matches the current locale
  const getLanguageFromLocale = (locale: string) => {
    const matchingOption = languageOptions.find(
      (option) => option.locale === locale,
    );
    return matchingOption?.value || "english";
  };

  const getPurposeDetailKey = (
    purpose: string,
    detailValue: string,
  ): string => {
    if (!purpose || !detailValue) return "";

    const purposeCategory =
      purposeDetailOptions[purpose as keyof typeof purposeDetailOptions];
    if (!purposeCategory) return "";

    const matchingOption = purposeCategory.options.find(
      (option) => option.label === detailValue || option.key === detailValue,
    );

    return matchingOption?.key || "";
  };

  const form = useForm<PersonalizedFormSchemaType>({
    resolver: zodResolver(isProfilePage ? FormSchema : NonProfileFormSchema),
    defaultValues: {
      name: user?.user_profile.full_name || authUser?.displayName || "",
      language:
        user?.user_profile.language || getLanguageFromLocale(currentLocale),
      purpose: user?.user_profile.purpose || "",
      purposeDetail: user?.user_profile.purpose_detail
        ? getPurposeDetailKey(
            user.user_profile.purpose || "",
            user.user_profile.purpose_detail,
          )
        : "",
      referralSource: user?.user_profile.referral_source || "",
      otherReferralSource: "",
      aiModel: user?.user_profile.chat_model_id || "3",
    },
    mode: "onChange",
  });

  const { isValid } = form.formState;

  function onSubmit(data: PersonalizedFormSchemaType) {
    const selectedLanguage = languageOptions.find(
      (option) => option.value === data.language,
    );

    const enhancedData = {
      ...data,
      userId: authUser?.uid,
    };

    handleSubmit(enhancedData);

    const days = 30;
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = date.toUTCString();
    const newLocale = selectedLanguage?.locale || "en";
    document.cookie = `NEXT_LOCALE=${newLocale};expires=${expires};path=/`;

    let targetPath: string;

    if (isProfilePage) {
      const pathnameWithoutLocale = currentLocale
        ? currentPathname.replace(`/${currentLocale}`, "")
        : currentPathname;
      targetPath = `/${newLocale}${pathnameWithoutLocale}`;
    } else {
      targetPath = `/${newLocale}`;
      return;
    }

    // Push to the determined target path
    router.push(targetPath);
    // Refresh to ensure the page loads correctly with the new locale/data
    router.refresh();
  }

  if (isLoading || authLoading) {
    return (
      <div className="w-full min-w-96">
        <PersonalizedFormSkeleton />
      </div>
    );
  }

  const showNameField = !authUser?.displayName;

  return (
    <div className="w-full mx-auto px-4">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full max-w-4xl mx-auto space-y-4"
        >
          {showNameField && (
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="w-full text-left block">
                  <FormLabel>
                    <span key="translation-name-label">
                      {t("personalizedForm.nameLabel")}
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      key="translation-name-input"
                      placeholder={t("signUp2.form.namePlaceholder")}
                      autoComplete="name"
                      className="h-12 w-full"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="language"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="text-left w-full block">
                  <span key="translation-language-label">
                    {t("personalizedForm.languageLabel")}
                  </span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-12 w-full">
                      <SelectValue
                        key="translation-language-value"
                        placeholder={t("personalizedForm.languagePlaceholder")}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="w-full">
                    {languageOptions.map((languageOption, index) => (
                      <SelectItem
                        key={`language-option-${index}`}
                        value={languageOption.value}
                      >
                        <span className="text-lg mr-2">
                          {languageOption.flag}
                        </span>
                        <span>{languageOption.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {isProfilePage && (
            <FormField
              control={form.control}
              name="aiModel"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="text-left w-full block">
                    <span key="translation-ai-model-label">
                      {t("personalizedForm.aiModel")}
                    </span>
                  </FormLabel>
                  <FormControl>
                    <AiModelDropdown
                      triggerClassName="h-12 flex w-full items-center justify-between rounded-md border border-input bg-background p-4 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
                      onModelSelect={field.onChange}
                      value={field.value}
                      disabled={isNewUser}
                      showUpgradeButton={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {!isProfilePage && (
            <>
              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="text-left w-full block">
                      <span key="translation-purpose-label">
                        {t("personalizedForm.purposeLabel")}
                      </span>
                    </FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Reset purposeDetail when purpose changes
                        form.setValue("purposeDetail", "");
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12 w-full py-3">
                          <SelectValue
                            key="translation-purpose-value"
                            placeholder={t(
                              "personalizedForm.purposePlaceholder",
                            )}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="w-full">
                        {purposeOptions.map((option, index) => (
                          <SelectItem
                            key={`purpose-option-${index}`}
                            value={option.value}
                            className="py-3"
                          >
                            <span key="purpose-option-label">
                              {option.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {form.watch("purpose") && (
                <div className="w-full transform transition-all duration-300 ease-in-out">
                  {purposeDetailOptions[
                    form.watch("purpose") as keyof typeof purposeDetailOptions
                  ] && (
                    <FormField
                      control={form.control}
                      name="purposeDetail"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormLabel className="text-left w-full block">
                            <span>
                              {
                                purposeDetailOptions[
                                  form.watch(
                                    "purpose",
                                  ) as keyof typeof purposeDetailOptions
                                ].question
                              }
                            </span>
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-12 w-full py-3">
                                <SelectValue
                                  placeholder={t(
                                    "personalizedForm2.purposeDetail.placeholder",
                                  )}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="w-full">
                              {purposeDetailOptions[
                                form.watch(
                                  "purpose",
                                ) as keyof typeof purposeDetailOptions
                              ].options.map((option, index) => (
                                <SelectItem
                                  key={`purpose-detail-option-${index}`}
                                  value={option.key}
                                  className="py-3"
                                >
                                  <span>{option.label}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}

              <FormField
                control={form.control}
                name="referralSource"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="text-left w-full block">
                      <span key="translation-referral-label">
                        {t("personalizedForm.referralLabel")}
                      </span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12 w-full py-3">
                          <SelectValue
                            key="translation-referral-value"
                            placeholder={t(
                              "personalizedForm.referralPlaceholder",
                            )}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="w-full">
                        {referralOptions.map((option, index) => (
                          <SelectItem
                            key={`referral-option-${index}`}
                            value={option.value}
                            className="py-3"
                          >
                            <span key="referral-option-label">
                              {option.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(form.watch("referralSource") === "other" ||
                form.watch("referralSource") === "otherSocial") && (
                <FormField
                  control={form.control}
                  name="otherReferralSource"
                  render={({ field }) => (
                    <FormItem className="w-full transform transition-all duration-300 ease-in-out">
                      <FormLabel className="text-left w-full block">
                        <span key="translation-other-referral-label">
                          {t(
                            "personalizedForm.otherReferralLabel",
                            "Please specify how you heard about us",
                          )}
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          key="translation-other-referral-input"
                          placeholder={t(
                            "personalizedForm.otherReferralPlaceholder",
                            "Tell us how you discovered YouLearn...",
                          )}
                          className="h-12 w-full"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </>
          )}

          <Button
            size="default"
            type="submit"
            className={cn(
              "w-full mt-6 h-12 flex items-center justify-center gap-2 text-base transition-colors",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              !isProfilePage &&
                !isValid &&
                "bg-primary/50 text-primary-foreground hover:bg-primary/40 cursor-not-allowed",
            )}
          >
            <span key="translation-finish-button">
              {t("personalizedForm.finishButton")}
            </span>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </Form>
    </div>
  );
}
