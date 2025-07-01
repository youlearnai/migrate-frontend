"use client";
import React, { useEffect, useState } from "react";
import useAuth from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Server, BellRing } from "lucide-react";
import { submitMaintenanceNotification } from "@/app/actions/db";
import { useTranslation } from "react-i18next";

const ServerMaintenance = () => {
  const { user, loading } = useAuth();
  const [localTimeString, setLocalTimeString] = useState("");
  const { t } = useTranslation();

  const formSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address" }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: user?.email || "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    const pstDate = new Date("2025-04-05T14:30:00-07:00");
    const pstEndDate = new Date("2025-04-05T17:30:00-07:00");

    const localStartTime = pstDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const localEndTime = pstEndDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const localStartDate = pstDate.toLocaleDateString([], {
      month: "long",
      day: "numeric",
    });
    const localEndDate = pstEndDate.toLocaleDateString([], {
      month: "long",
      day: "numeric",
    });
    const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Format: "April 5, 2:30 PM - April 6, 3:00 AM Timezone"
    setLocalTimeString(
      `${localStartDate}, ${localStartTime} - ${localEndDate}, ${localEndTime} ${localTimezone}`,
    );
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const email = values.email;
    if (!email) return;

    const result = await submitMaintenanceNotification(email);
    if (result.success) {
      toast.success(
        result.message || "You will be notified when maintenance is complete",
      );
    } else {
      toast.error(
        result.error || "Failed to save notification. Please try again.",
      );
    }
  };

  useEffect(() => {
    if (loading) return;
    if (user) {
      form.setValue("email", user.email || "");
    }
  }, [loading, user]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen pb-[100px] md:pb-[200px] bg-background p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex justify-center">
          <Server className="h-24 w-24 text-primary animate-pulse [animation-duration:2s]" />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold">{t("maintenance.title")}</h1>
          {localTimeString && (
            <p className="text-sm text-muted-foreground">
              {t("maintenance.description")} <strong>{localTimeString}</strong>
            </p>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Enter your email to be notified"
                      {...field}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              <BellRing className="mr-2 h-4 w-4" />
              {t("maintenance.notifyMe")}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ServerMaintenance;
