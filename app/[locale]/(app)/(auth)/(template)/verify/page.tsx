"use client";
import { auth } from "@/auth/config";
import { Button } from "@/components/ui/button";
import useCooldown from "@/hooks/use-cool-down";
import { mapFirebaseErrorMessage } from "@/lib/utils";
import { useSignUp } from "@/query-hooks/user";
import { AuthError } from "firebase/auth";
import { Verified } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import {
  useAuthState,
  useSendEmailVerification,
} from "react-firebase-hooks/auth";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const VerifyPage = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const [cooldown, startCooldown] = useCooldown(30);
  const [sendEmailVerification, sending, error] =
    useSendEmailVerification(auth);
  const { mutate: signUp } = useSignUp();
  const [user, loading, authError] = useAuthState(auth);

  const handleResend = async () => {
    const result = await sendEmailVerification();
    if (result) {
      toast.success(t("steps.verificationEmailResent"));
      startCooldown();
    } else {
      toast.error(t("steps.verificationEmailError"));
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const checkEmailVerified = async () => {
      if (user && !user.emailVerified) {
        await user.reload();
        if (user.emailVerified) {
          const idToken = await user.getIdToken();
          const authData = {
            user_id: user.uid,
            email: user.email!,
            full_name: user.email!,
            photo_url: user.photoURL!,
            education_level: null,
            username: user.email!,
            language: "english",
            interests: [],
          };

          await signUp(
            {
              userData: authData,
              idToken,
            },
            {
              onSuccess: () => {
                localStorage.setItem("newUser", "true");
                router.push("/personal-form");
              },
            },
          );
        }
      }
    };

    if (user) {
      interval = setInterval(checkEmailVerified, 1500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user]);

  if (loading) {
    return null;
  }

  if (!email || email !== user?.email) {
    router.push("/signin");
  }

  return (
    <section className="max-w-md mx-auto w-full py-4 px-4">
      <div className="flex items-center justify-center gap-3 mb-4">
        <h1 className="text-2xl font-semibold">{t("steps.verifyAccount")}</h1>
      </div>
      <div className="space-y-6 text-center mb-4">
        <p className="text-md font-medium text-primary/70 border-b border-primary/20 pb-4">
          {t("steps.doNotCloseTab")}
        </p>

        <div className="space-y-2">
          <p className="text-md text-primary/70">
            {t("steps.verificationEmailSentMessage")}
          </p>
          <p className="font-semibold text-destructive">
            {t("steps.checkInboxOrJunk")}
          </p>
          <p className="text-md text-primary/70">
            {t("steps.clickVerificationLink")}
          </p>
        </div>

        <Button
          onClick={handleResend}
          size="lg"
          className="w-full max-w-xs text-md"
          disabled={cooldown > 0}
        >
          {cooldown > 0
            ? t("steps.resendEmailCooldown", { cooldown })
            : t("steps.resendEmail")}
        </Button>
      </div>
      {error && (
        <p className="text-destructive text-sm text-center mb-4">
          {t(mapFirebaseErrorMessage(error as AuthError))}
        </p>
      )}
      <div className="text-center text-primary/50">
        {t("signInMessage.noAccount")}{" "}
        <Link
          href="/signup"
          className="mr-1 text-primary/80 underline hover:text-primary"
        >
          {t("signInMessage.signUp")}
        </Link>
      </div>
    </section>
  );
};

export default VerifyPage;
