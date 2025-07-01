"use client";
import { auth } from "@/auth/config";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSendPasswordResetEmail } from "react-firebase-hooks/auth";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

const ResetPasswordPage = () => {
  const { t } = useTranslation();
  const formSchema = z.object({
    input: z.string().min(1, {
      message: t("forgetPassword.emailRequired"),
    }),
  });

  const [sendPasswordResetEmail, error] = useSendPasswordResetEmail(auth);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      input: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const result = await sendPasswordResetEmail(values.input!);
    if (result) {
      toast.success(t("forgetPassword.resetEmailSent"));
      form.reset();
    } else {
      toast.error(t("forgetPassword.tryAgain"));
    }
  }

  return (
    <section className="flex flex-col min-w-96 w-full items-center justify-center">
      <div className="flex items-center flex-col">
        <span className="text-xl text-center lg:text-2xl">
          {t("forgetPasswordShort.title")}
        </span>
        <span className="text-primary/50 mt-3 text-center">
          {t("forgetPasswordShort.subtitle")}
        </span>
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-4"
        >
          <FormField
            control={form.control}
            name="input"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="email"
                    className="text-lg mt-4 transition-all duration-200 shadow-lg"
                    placeholder={t("forgetPassword.emailPlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-center">
            <Button
              type="submit"
              variant="default"
              className="w-full h-12 mb-4 text-md"
            >
              {t("forgetPassword.reset")}
            </Button>
          </div>
        </form>
      </Form>
      <div className="text-primary/50 mb-6 text-md">
        {t("steps.alreadyHaveAccount")}{" "}
        <Link
          href="/signin"
          className="mr-1 text-primary/80 underline hover:text-primary"
        >
          {t("steps.signIn")}
        </Link>
      </div>
    </section>
  );
};

export default ResetPasswordPage;
