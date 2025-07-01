"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Textarea } from "@/components/ui/textarea";
import useAuth from "@/hooks/use-auth";
import { useModalStore } from "@/hooks/use-modal-store";
import { useFeedbackOptions } from "@/lib/constants";
import { useContact } from "@/query-hooks/user";
import { zodResolver } from "@hookform/resolvers/zod";
import { PhoneCall, Send } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

export default function InputForm() {
  const { t } = useTranslation();
  const { onOpen } = useModalStore();
  const feedbackOptions = useFeedbackOptions();
  const { user, loading } = useAuth();
  const FormSchema = z.object({
    name: z.string().min(2, {
      message: t("contact.form.nameValidation"),
    }),
    email: z.string().email({ message: t("contact.form.emailValidation") }),
    messageType: z.string().optional(),
    message: z.string().min(1, t("contact.form.messageValidation")),
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: user?.displayName || "",
      email: user?.email || "",
      message: "",
    },
  });

  const { mutate: submit } = useContact();

  function onSubmit(data: z.infer<typeof FormSchema>) {
    submit(
      {
        name: data.name,
        email: data.email,
        message: data.message,
        imageUrls: [],
      },
      {
        onSuccess: (data, variables) => {
          toast.success(
            t("contact.form.submitSuccess", { name: variables.name }),
          );
        },
      },
    );
    form.reset();
  }

  useEffect(() => {
    if (user && !loading) {
      form.setValue("name", user.displayName || "");
      form.setValue("email", user.email || "");
    }
  }, [user, loading]);

  if (loading) {
    return null;
  }

  return (
    <div className="w-full mt-6 sm:mt-12 flex items-center justify-center">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full max-w-2xl space-y-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("contact.form.name")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("contact.form.namePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("contact.form.nameDescription")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("contact.form.email")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("contact.form.emailPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("contact.form.emailDescription")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="messageType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("contact.form.feedbackType")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-12">
                      <SelectValue
                        placeholder={t("contact.form.feedbackTypePlaceholder")}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {feedbackOptions.map((feedbackOption, index) => (
                      <SelectItem key={index} value={feedbackOption.value}>
                        {t(`${feedbackOption.value}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {t("contact.form.feedbackTypeDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("contact.form.message")}</FormLabel>
                <FormControl>
                  <Textarea
                    className="min-h-[16rem] h-64 focus-visible:ring-1 transition-all ring-primary p-6 duration-200"
                    placeholder={t("contact.form.messagePlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {t("contact.form.messageDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex flex-col space-y-3">
            <Button type="submit" className="w-full flex space-x-2">
              <span>{t("contact.form.submit")}</span>
              <Send className="flex-shrink-0 h-4 w-4" />
            </Button>
            <Button
              onClick={() =>
                onOpen("schedule", {
                  calLink: "/youlearn/15min",
                })
              }
              type="button"
              variant="secondary"
              className="w-full flex space-x-2 border bg-primary/5"
            >
              <span>{t("modal.schedule")}</span>
              <PhoneCall className="flex-shrink-0 h-4 w-4" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
