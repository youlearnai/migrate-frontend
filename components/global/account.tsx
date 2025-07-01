import { auth } from "@/auth/config";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import useAuth from "@/hooks/use-auth";
import { useModalStore } from "@/hooks/use-modal-store";
import { useLogOut, useUser, useGetTier } from "@/query-hooks/user";
import {
  ChevronDown,
  Crown,
  History,
  LogIn,
  LogOut,
  Settings,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSignOut } from "react-firebase-hooks/auth";
import { useTranslation } from "react-i18next";
import ProWrapper from "./pro-wrapper";

const Account = () => {
  const pathname = usePathname();
  const { t } = useTranslation();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { data: user, isLoading: userLoading } = useUser();
  const { data: tier } = useGetTier();
  const [signOut, signOutLoading] = useSignOut(auth);
  const { mutate: logOut } = useLogOut();
  const { onOpen } = useModalStore();
  const { user: firebaseUser, loading } = useAuth();

  useEffect(() => {
    // Only show feedback modal if:
    // 1. User is power user
    // 2. Feedback modal hasn't been shown before
    // 3. User is not new (to prevent conflict with onboarding)
    // 4. Feedback modal hasn't been completed before
    if (
      user &&
      !userLoading &&
      user.is_power &&
      localStorage.getItem("feedback") !== "true" &&
      localStorage.getItem("newUser") !== "true" &&
      localStorage.getItem("feedbackCompleted") !== "true"
    ) {
      onOpen("feedback");
      localStorage.setItem("feedback", "true");
    }
  }, [user, onOpen, userLoading, localStorage]);

  const handleSignOut = async () => {
    router.push("/");
    await new Promise((resolve) => setTimeout(resolve, 100));
    await signOut();
    logOut();
  };

  const handleToggle = (checked: boolean) => {
    setTheme(checked ? "dark" : "light");
  };

  const signInLink = `/signin${!pathname.includes("reset-password") ? `?returnUrl=${encodeURIComponent(pathname)}` : ""}`;

  if (loading || signOutLoading)
    return <Skeleton className="w-full h-8 border" />;

  if (!firebaseUser)
    return (
      <Link className="w-full" href={signInLink}>
        <Button className="w-full" size="sm">
          {t("accountMenu.signIn")}
        </Button>
      </Link>
    );

  const TriggerButton = (
    <DropdownMenuTrigger asChild>
      <Button
        className="dark:bg-transparent bg-white rounded-lg border border-primary/10 dark:border-primary/20 justify-between w-full shadow-sm h-fit px-4 py-3 truncate text-left transition-colors duration-200 ease-in-out hover:bg-primary/5 dark:hover:bg-primary/10"
        variant="outline"
        size="sm"
      >
        <p className="truncate text-sm">{firebaseUser?.email}</p>
        <ChevronDown className="h-4 flex-shrink-0 w-4" />
      </Button>
    </DropdownMenuTrigger>
  );

  return (
    <DropdownMenu>
      {tier !== "free" || user?.user_group?.group !== "show_usage_061925" ? (
        <ProWrapper>{TriggerButton}</ProWrapper>
      ) : (
        TriggerButton
      )}
      <DropdownMenuContent className="w-[232px] rounded-xl">
        <DropdownMenuGroup>
          <Link href="/profile">
            <DropdownMenuItem className="dark:hover:bg-primary/10 hover:bg-primary/5 w-full cursor-pointer rounded-sm h-12">
              <Avatar>
                <AvatarImage
                  draggable={false}
                  src={firebaseUser?.photoURL || ""}
                />
                <AvatarFallback className="uppercase">
                  {firebaseUser?.displayName?.substring(0, 2) || "404"}
                </AvatarFallback>
              </Avatar>
              <span>{firebaseUser?.displayName || t("accountMenu.guest")}</span>
            </DropdownMenuItem>
          </Link>
          <Link href="/profile">
            <DropdownMenuItem className="dark:hover:bg-primary/10 hover:bg-primary/5 w-full space-x-3 cursor-pointer rounded-sm h-8">
              <Settings className="h-4 w-4" />
              <span>{t("accountMenu.settings")}</span>
            </DropdownMenuItem>
          </Link>
          <Link href="/pricing?source=account-dropdown-button">
            <DropdownMenuItem className="dark:hover:bg-primary/10 hover:bg-primary/5 w-full space-x-3 cursor-pointer rounded-sm h-8">
              <Crown className="h-4 w-4" />
              <span>{t("accountMenu.pricing")}</span>
            </DropdownMenuItem>
          </Link>
          <Link href="/history">
            <DropdownMenuItem className="dark:hover:bg-primary/10 hover:bg-primary/5 w-full space-x-3 cursor-pointer rounded-sm h-8">
              <History className="h-4 w-4" />
              <span>{t("accountMenu.history")}</span>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuItem
          onSelect={(e: Event) => e.preventDefault()}
          className="dark:hover:bg-primary/10 hover:bg-primary/5 w-full space-x-3 cursor-default rounded-sm h-8"
        >
          <Switch checked={theme === "dark"} onCheckedChange={handleToggle} />
          <span>{t("accountMenu.darkMode")}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {firebaseUser ? (
          <DropdownMenuItem
            onClick={handleSignOut}
            className="space-x-3 dark:hover:bg-primary/10 hover:bg-primary/5 w-full cursor-pointer rounded-sm h-8"
          >
            <LogOut className="h-4 w-4" />
            <span>{t("accountMenu.logOut")}</span>
          </DropdownMenuItem>
        ) : (
          <Link href="/signin">
            <DropdownMenuItem className="dark:hover:bg-primary/10 hover:bg-primary/5 w-full space-x-3 cursor-pointer rounded-sm h-8">
              <LogIn className="h-4 w-4" />
              <span>{t("accountMenu.signIn")}</span>
            </DropdownMenuItem>
          </Link>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Account;
