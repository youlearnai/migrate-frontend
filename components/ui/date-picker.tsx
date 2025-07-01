"use client";

import * as React from "react";
import { format, addMonths } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  maxDate?: Date;
  popoverContentProps?: React.ComponentProps<typeof PopoverContent>;
}

export function DatePicker({
  value,
  onChange,
  maxDate,
  popoverContentProps,
}: DatePickerProps) {
  const { t } = useTranslation();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const disabledDates = {
    before: tomorrow,
    ...(maxDate && { after: maxDate }),
  };

  return (
    <Popover modal>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start h-12 text-left font-normal",
            !value && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? (
            format(value, "PPP")
          ) : (
            <span key="pick-date">{t("pickADate")}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
        {...popoverContentProps}
      >
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          disabled={disabledDates}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
