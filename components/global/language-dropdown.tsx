import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguageOptions } from "@/lib/constants";
import { useTranslation } from "react-i18next";
import { useParams, useRouter, usePathname } from "next/navigation";
import useAuth from "@/hooks/use-auth";
import { toast } from "sonner";
import { useUpdateUser, useUser } from "@/query-hooks/user";

const LanguageDropdown = () => {
  const params = useParams();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const languageOptions = useLanguageOptions();
  const router = useRouter();
  const currentPathname = usePathname();
  const currentLocale = params.locale as string;
  const { mutate: updateUser } = useUpdateUser();

  const signInLink = `/signin${!pathname.includes("reset-password") ? `?returnUrl=${encodeURIComponent(pathname)}` : ""}`;

  const updateUserProfile = (language: string) => {
    updateUser({
      language: language,
    });
  };

  const handleLanguageChange = (selectedLanguageValue: string) => {
    if (!user) {
      router.push(signInLink);
      toast.message("Please sign in to change languages");
      return;
    }

    const selectedLanguage = languageOptions.find(
      (option) => option.value === selectedLanguageValue,
    );

    updateUserProfile(selectedLanguageValue);

    const days = 30;
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = date.toUTCString();
    document.cookie = `NEXT_LOCALE=${selectedLanguage?.locale || "en"};expires=${expires};path=/`;

    const localeSegment = `/${selectedLanguage?.locale}`;
    const pathnameWithoutLocale = currentLocale
      ? currentPathname.replace(`/${currentLocale}`, "")
      : currentPathname;

    const newPathname = `${localeSegment}${pathnameWithoutLocale}`;
    router.push(newPathname);
    router.refresh();
  };

  const defaultLanguage = languageOptions.find(
    (option) => option.locale === params.locale,
  );

  if (loading || user) return null;

  return (
    <Select
      defaultValue={defaultLanguage?.value}
      onValueChange={handleLanguageChange}
      aria-label={t("common.selectLanguage")}
    >
      <SelectTrigger className="w-fit" aria-label={t("common.currentLanguage")}>
        <SelectValue>
          <span className="text-xl mr-2" aria-hidden="true">
            {defaultLanguage?.flag}
          </span>
          <span className="sr-only">{defaultLanguage?.value}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {languageOptions.map((languageOption, index) => (
          <SelectItem
            className="cursor-pointer"
            key={index}
            value={languageOption.value}
          >
            <span className="text-xl">
              <span aria-hidden="true">{languageOption.flag}</span>&nbsp;
              <span className="text-sm capitalize">{languageOption.value}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default LanguageDropdown;
