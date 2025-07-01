import React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { toast } from "sonner";
import { auth } from "@/auth/config";
import {
  useAuthState,
  useSendEmailVerification,
} from "react-firebase-hooks/auth";
import { useTranslation } from "react-i18next";

const VerifyBanner = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [sendEmailVerification, sending, verificationError] =
    useSendEmailVerification(auth);
  const [user, loading] = useAuthState(auth);
  const { t } = useTranslation();

  const handleVerify = async () => {
    const result = await sendEmailVerification();
    if (result) {
      toast.success(t("steps.verificationEmailSent"));
    } else {
      toast.error(t("steps.verificationEmailError"));
    }
  };

  const handleVerifyEmail = () => {
    handleVerify();
    router.push(`/verify?email=${user?.email}`);
  };

  if (loading) return null;

  if (user && !user?.emailVerified)
    return (
      <Alert className="fixed bottom-0 left-0 right-0 z-50 flex rounded-none py-3 px-4 bg-yellow-100 border-yellow-300 text-yellow-800">
        <div className="flex items-center justify-between gap-2 text-sm max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-center gap-2 flex-grow flex-wrap">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium">{t("steps.verifyEmail")}</span>
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto text-sm font-semibold text-yellow-800 hover:text-yellow-900 underline"
              onClick={handleVerifyEmail}
            >
              {t("steps.verifyEmailButton")}
            </Button>
          </div>
        </div>
      </Alert>
    );
};

export default VerifyBanner;
