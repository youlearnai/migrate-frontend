import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Input } from "./input";

interface TimestampInputProps {
  value: number;
  onChange: (value: number) => void;
  maxValue?: number;
  minValue?: number;
  id?: string;
  className?: string;
  step?: number;
  disabled?: boolean;
  error?: string;
}

const TimestampInput = ({
  value,
  onChange,
  maxValue,
  minValue = 0,
  id,
  className,
  step = 1,
  disabled = false,
  error,
}: TimestampInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState<string>(formatValue(value));
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Format the value for display (HH:MM:SS)
  function formatValue(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  // Update the displayed value when the prop changes (but not during editing)
  useEffect(() => {
    if (!isEditing) {
      setInputValue(formatValue(value));
    }
  }, [value, isEditing]);

  // Parse input string to seconds
  const parseValue = (input: string): number | null => {
    // Handle empty input as 0
    if (!input || input === ":" || input === "::" || input === "::") return 0;

    // Handle HH:MM:SS format
    const hhmmssRegex = /^(\d{1,2}):(\d{1,2}):(\d{1,2})$/;
    const hhmmssMatch = input.match(hhmmssRegex);
    if (hhmmssMatch) {
      const hours = parseInt(hhmmssMatch[1], 10);
      const mins = parseInt(hhmmssMatch[2], 10);
      const secs = parseInt(hhmmssMatch[3], 10);
      if (mins < 60 && secs < 60) {
        return hours * 3600 + mins * 60 + secs;
      }
    }

    // Handle HH:MM format - interpret as hours and minutes
    const hhmmRegex = /^(\d{1,2}):(\d{1,2})$/;
    const hhmmMatch = input.match(hhmmRegex);
    if (hhmmMatch) {
      const hours = parseInt(hhmmMatch[1], 10);
      const mins = parseInt(hhmmMatch[2], 10);
      if (mins < 60) {
        return hours * 3600 + mins * 60;
      }
    }

    // Handle MM:SS format - interpret as minutes and seconds
    const mmssRegex = /^(\d{1,2}):(\d{1,2})$/;
    const mmssMatch = input.match(mmssRegex);
    if (mmssMatch) {
      const mins = parseInt(mmssMatch[1], 10);
      const secs = parseInt(mmssMatch[2], 10);
      if (secs < 60) {
        return mins * 60 + secs;
      }
    }

    // Handle HH format (without colon) - interpret as hours
    const hhRegex = /^(\d{1,2})$/;
    const hhMatch = input.match(hhRegex);
    if (hhMatch) {
      const hours = parseInt(hhMatch[1], 10);
      return hours * 3600;
    }

    // Handle HH: format - interpret as hours
    const hhColonRegex = /^(\d{1,2}):$/;
    const hhColonMatch = input.match(hhColonRegex);
    if (hhColonMatch) {
      const hours = parseInt(hhColonMatch[1], 10);
      return hours * 3600;
    }

    // Handle HH:MM: format - interpret as hours and minutes
    const hhmmColonRegex = /^(\d{1,2}):(\d{1,2}):$/;
    const hhmmColonMatch = input.match(hhmmColonRegex);
    if (hhmmColonMatch) {
      const hours = parseInt(hhmmColonMatch[1], 10);
      const mins = parseInt(hhmmColonMatch[2], 10);
      if (mins < 60) {
        return hours * 3600 + mins * 60;
      }
    }

    // Handle :MM:SS format
    const mmssWithLeadingColonRegex = /^:(\d{1,2}):(\d{1,2})$/;
    const mmssWithLeadingColonMatch = input.match(mmssWithLeadingColonRegex);
    if (mmssWithLeadingColonMatch) {
      const mins = parseInt(mmssWithLeadingColonMatch[1], 10);
      const secs = parseInt(mmssWithLeadingColonMatch[2], 10);
      if (mins < 60 && secs < 60) {
        return mins * 60 + secs;
      }
    }

    // Handle :SS format (seconds only)
    const ssRegex = /^:(\d{1,2})$/;
    const ssMatch = input.match(ssRegex);
    if (ssMatch) {
      const secs = parseInt(ssMatch[1], 10);
      if (secs < 60) {
        return secs;
      }
    }

    // Handle ::SS format (seconds only with two leading colons)
    const ssWithTwoColonsRegex = /^::(\d{1,2})$/;
    const ssWithTwoColonsMatch = input.match(ssWithTwoColonsRegex);
    if (ssWithTwoColonsMatch) {
      const secs = parseInt(ssWithTwoColonsMatch[1], 10);
      if (secs < 60) {
        return secs;
      }
    }

    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // Allow empty input for clearing
    if (newValue === "") {
      setInputValue("");
      setIsEditing(true);
      onChange(0); // Default to 0 when cleared
      return;
    }

    // Only allow numbers and colons
    const sanitized = newValue.replace(/[^\d:]/g, "");
    setInputValue(sanitized);
    setIsEditing(true);

    // Try to parse as time
    const parsed = parseValue(sanitized);
    if (parsed !== null) {
      // Check bounds
      const boundedValue = Math.max(minValue, parsed);
      const finalValue =
        maxValue !== undefined
          ? Math.min(maxValue, boundedValue)
          : boundedValue;
      onChange(finalValue);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);

    // If empty or invalid, reset to the last valid value
    if (inputValue === "" || parseValue(inputValue) === null) {
      setInputValue(formatValue(value));
    } else {
      // Format the valid input nicely
      const parsed = parseValue(inputValue);
      if (parsed !== null) {
        setInputValue(formatValue(parsed));
      }
    }
  };

  // Handle special key presses
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    // Handle enter key to complete editing
    if (e.key === "Enter") {
      handleBlur();
      return;
    }

    // Handle escape key to cancel editing
    if (e.key === "Escape") {
      setIsEditing(false);
      setInputValue(formatValue(value));
      inputRef.current?.blur();
      return;
    }

    // Handle arrow keys for adjusting values
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();

      // Find cursor position to determine if we're editing hours, minutes or seconds
      const curPos = inputRef.current?.selectionStart || 0;
      const isEditingHours = curPos < 3;
      const isEditingMinutes = curPos >= 3 && curPos < 6;
      const isEditingSeconds = curPos >= 6;
      const adjustment = e.key === "ArrowUp" ? step : -step;

      let newValue: number;
      if (isEditingHours) {
        // Adjust hours
        const hours = Math.floor(value / 3600) + (adjustment > 0 ? 1 : -1);
        const mins = Math.floor((value % 3600) / 60);
        const secs = value % 60;
        newValue = Math.max(0, hours) * 3600 + mins * 60 + secs;
      } else if (isEditingMinutes) {
        // Adjust minutes
        const hours = Math.floor(value / 3600);
        let mins = Math.floor((value % 3600) / 60) + (adjustment > 0 ? 1 : -1);
        const secs = value % 60;

        // Wrap minutes appropriately
        if (mins >= 60) mins = 0;
        else if (mins < 0) mins = 59;

        newValue = hours * 3600 + mins * 60 + secs;
      } else {
        // Adjust seconds
        const hours = Math.floor(value / 3600);
        const mins = Math.floor((value % 3600) / 60);
        let secs = (value % 60) + adjustment;

        // Wrap seconds appropriately
        if (secs >= 60) secs = 0;
        else if (secs < 0) secs = 59;

        newValue = hours * 3600 + mins * 60 + secs;
      }

      // Apply bounds
      const boundedValue = Math.max(minValue, newValue);
      const finalValue =
        maxValue !== undefined
          ? Math.min(maxValue, boundedValue)
          : boundedValue;

      onChange(finalValue);

      // Keep the cursor in the same position
      const currentPos = inputRef.current?.selectionStart || 0;
      setTimeout(() => {
        inputRef.current?.setSelectionRange(currentPos, currentPos);
      }, 0);
    }
  };

  // Handle focus to prepare for editing
  const handleFocus = () => {
    setIsEditing(true);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        id={id}
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        className={cn(
          error && "border-red-500 focus-visible:ring-red-500",
          className,
        )}
        placeholder="00:00:00"
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-500 mt-1">
          {error}
        </p>
      )}
    </div>
  );
};

export { TimestampInput };
