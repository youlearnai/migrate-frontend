import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useAuth from "@/hooks/use-auth";
import { aiModelsOptions } from "@/lib/utils";
import { AiModelDropdownProps } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useGetTier, useUpdateUser, useUserProfile } from "@/query-hooks/user";
import { usePathname, useRouter } from "next/navigation";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Skeleton } from "../ui/skeleton";
import { useErrorStore } from "@/hooks/use-error-store";
import { ChevronDown, ChevronUp, Sparkle, Sparkles } from "lucide-react";

const AiModelDropdown = ({
  triggerClassName,
  contentClassName,
  itemClassName,
  showUpgradeButton = true,
  onModelSelect,
  value,
  disabled = false,
}: AiModelDropdownProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const { data: userProfile } = useUserProfile();
  const { data: userTier, isLoading: tierLoading } = useGetTier();
  const { t } = useTranslation();
  const { mutate: updateUser } = useUpdateUser();
  const [optimisticValue, setOptimisticValue] = useState<string | undefined>(
    value,
  );
  const { openModal } = useErrorStore();

  const currentValue =
    optimisticValue ?? value ?? userProfile?.user_profile.chat_model_id;

  const signInLink = `/signin${!pathname.includes("reset-password") ? `?returnUrl=${encodeURIComponent(pathname)}` : ""}`;

  const handleModelChange = async (newValue: string) => {
    if (!user) {
      router.push(signInLink);
      toast.message("Please sign in to change models");
      return;
    }

    const selectedOption = aiModelsOptions.find(
      (option) => option.value === newValue,
    );

    if (!selectedOption?.tiers.includes(userTier as string)) {
      openModal(
        {
          status: 402,
          statusText: t("pricing.upgradeRequired"),
        },
        {
          source: "ai-model-dropdown",
        },
      );
      return;
    }

    setOptimisticValue(newValue);

    try {
      if (onModelSelect) {
        onModelSelect(newValue);
      } else {
        await updateUser({
          chatModelId: newValue,
        });
      }
    } catch (error) {
      setOptimisticValue(value);
      toast.error(t("errors.modelUpdateFailed"));
    }
  };

  const selectedModelOption = aiModelsOptions.find(
    (model) => model.value === currentValue,
  );

  if (authLoading || tierLoading) {
    return <Skeleton className={cn("h-7 w-24", triggerClassName)} />;
  }

  if (!user || !userTier) return null;

  const defaultTriggerClass = triggerClassName
    ? triggerClassName
    : "text-primary/60 h-7 p-1.5 w-fit border-none focus:border-none focus:ring-0 focus:outline-none focus:ring-offset-0";

  const defaultContentClass = contentClassName ? contentClassName : "text-xs";

  return (
    <Select
      value={currentValue}
      onValueChange={handleModelChange}
      disabled={disabled}
    >
      <SelectTrigger className={cn(defaultTriggerClass, "bg-transparent mb-1")}>
        <SelectValue>
          {triggerClassName ? (
            <span className="capitalize px-1">{selectedModelOption?.name}</span>
          ) : (
            selectedModelOption && (
              <div className="flex items-center text-xs">
                <Sparkle className="h-4 w-4 flex-shrink-0 block md:hidden" />
                <span className="capitalize truncate max-w-[70px] sm:max-w-[54px] md:block hidden">
                  {selectedModelOption.name}
                </span>
              </div>
            )
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent side="top" className={defaultContentClass}>
        {aiModelsOptions.map((aiModel, index) => {
          const isNotAvailable = !aiModel.tiers.includes(userTier as string);
          return (
            <SelectItem
              className={cn("cursor-pointer rounded-sm")}
              key={index}
              value={aiModel.value}
            >
              <div
                className={cn(
                  "flex items-center",
                  "justify-between space-x-2 w-full",
                )}
              >
                <span
                  className={cn(
                    "capitalize magic-bar-input-propagate-click",
                    !itemClassName &&
                      isNotAvailable &&
                      "text-muted-foreground hover:text-muted-foreground",
                  )}
                >
                  {aiModel.name}
                </span>
                {isNotAvailable && (
                  <span className="text-[10px] bg-green-500/10 text-green-500 dark:text-[#7DFF97] px-1 py-0.5 rounded">
                    {t("header.upgrade")}
                  </span>
                )}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};

export default memo(AiModelDropdown);
