import { Button } from "@/components/ui/button";
import useAuth from "@/hooks/use-auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { LoadingDots } from "../skeleton/loading-dots";
import { AuthRequiredProps } from "@/lib/types";

const AuthRequired = ({ message, loadingMessage }: AuthRequiredProps) => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { user, loading: userLoading } = useAuth();

  // Create sign in and sign up links with return URL
  const getActionLink = (link: string) => {
    return `${link}?returnUrl=${encodeURIComponent(pathname)}`;
  };

  if (userLoading) {
    return (
      <div className="md:h-[calc(100vh-150px)] h-full w-full flex items-center justify-center">
        <LoadingDots message={loadingMessage || t("common.loading")} />
      </div>
    );
  }

  if (user) {
    return null; // User is authenticated, no need to show anything
  }

  return (
    <div className="flex flex-col items-center justify-center px-0 xl:px-8 max-w-md mx-auto">
      <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm hover:dark:border-neutral-700/40 w-full p-6">
        <h2 className="text-xl text-center font-medium mb-2">
          {t("auth.required.heading")}
        </h2>
        <p className="text-muted-foreground text-center mb-6">
          {message || t("studyGuide.signInRequired")}
        </p>

        <div className="flex flex-col gap-2">
          <Link href={getActionLink("/signin")} className="w-full">
            <Button
              type="button"
              variant="default"
              className="text-base w-full h-10"
              size="lg"
            >
              {t("header.signIn")}
            </Button>
          </Link>

          <Link href={getActionLink("/signup")} className="w-full">
            <Button
              type="button"
              variant="outline"
              className="w-full h-10 text-base border-primary/20"
            >
              {t("signInMessage.signUp") || "Sign Up"}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AuthRequired;
