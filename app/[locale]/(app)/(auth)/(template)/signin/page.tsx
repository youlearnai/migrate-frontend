"use client";
import { auth } from "@/auth/config";
import Spinner from "@/components/global/spinner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { mapFirebaseErrorMessage, validateReturnUrl } from "@/lib/utils";
import { useSignIn, useSignUp } from "@/query-hooks/user";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useSendEmailVerification,
  useSignInWithEmailAndPassword,
  useSignInWithGoogle,
} from "react-firebase-hooks/auth";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";
import { z } from "zod";

const SignInPage = () => {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const returnUrl = validateReturnUrl(searchParams.get("returnUrl") || "/");
  const referralCode = searchParams.get("referralCode");
  const router = useRouter();
  const [signInWithEmailAndPassword, user, loading, error] =
    useSignInWithEmailAndPassword(auth);
  const [signInWithGoogle, googleUser, googleLoading, googleError] =
    useSignInWithGoogle(auth);
  const [sendEmailVerification, sending, verificationError] =
    useSendEmailVerification(auth);
  const { mutate: signIn, isPending: signInLoading } = useSignIn();
  const { mutate: signUp, isPending: signUpLoading } = useSignUp();

  const SignInSchema = z.object({
    email: z.string().email({ message: t("signIn.form.emailValidation") }),
    password: z
      .string()
      .min(6, { message: t("signIn.form.passwordValidation") }),
  });

  const form = useForm<z.infer<typeof SignInSchema>>({
    resolver: zodResolver(SignInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  const handleVerify = async () => {
    const result = await sendEmailVerification();
    if (result) {
      toast.success(t("steps.verificationEmailSent"));
    } else {
      toast.error(t("steps.verificationEmailError"));
    }
  };

  const onSubmit = async (data: z.infer<typeof SignInSchema>) => {
    const result = await signInWithEmailAndPassword(data.email, data.password);
    if (result?.user) {
      if (!result.user.emailVerified) {
        router.push("/verify?email=" + result.user.email);
        handleVerify();
        return;
      }
      const user = result.user.uid;
      const idToken = await result.user.getIdToken();
      await signIn(
        { userId: user, idToken, statusCodes: [404, 409] },
        {
          onSuccess: () => {
            router.push(returnUrl);
          },
        },
      );
    }
  };

  const handleGoogleSignIn = async () => {
    const result = await signInWithGoogle();
    if (result?.user) {
      if (!result.user.emailVerified) {
        router.push("/verify?email=" + result.user.email);
        handleVerify();
        return;
      }
      const user = result.user.uid;
      const idToken = await result.user.getIdToken();
      await signIn(
        { userId: user, idToken, statusCodes: [404, 409] },
        {
          onSuccess: () => {
            router.push(returnUrl);
          },
          onError: async (data) => {
            if (data.message.toLowerCase().includes("failed to fetch")) {
              router.push(returnUrl);
              return;
            }
            const user = result.user;
            await signUp(
              {
                userData: {
                  user_id: user?.uid!,
                  email: user?.email!,
                  full_name: user?.displayName!,
                  photo_url: user?.photoURL!,
                  education_level: null,
                  username: user
                    ?.displayName!?.replace(/[^A-Za-z0-9]/g, "")
                    .substring(0, 15)!,
                  language: "english",
                  interests: [],
                  referral_code: referralCode || undefined,
                },
                idToken,
              },
              {
                onSuccess: () => {
                  localStorage.setItem("newUser", "true");
                  router.push("/personal-form");
                },
                onError: () => {
                  toast.error(t("signUp.form.createAccountFailed"));
                },
              },
            );
          },
        },
      );
    }
  };

  return (
    <section className="flex min-w-96 flex-col items-center justify-center">
      <span className="text-xl text-center lg:text-2xl">
        {t("welcomeBack.title")}
      </span>
      <span className="text-primary/50 text-center mt-2 mb-5">
        {t("welcomeBack.subtitle")}
      </span>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex w-full flex-col"
        >
          <Button
            type="button"
            onClick={handleGoogleSignIn}
            size="lg"
            className="shadow-lg w-full text-md h-12 flex gap-2 bg-white dark:bg-neutral-800/20 text-primary border border-primary/10 hover:bg-primary/5 hover:dark:bg-primary/5 "
            disabled={googleLoading || signInLoading || signUpLoading}
          >
            {googleLoading || signInLoading || signUpLoading ? (
              <Spinner />
            ) : (
              <FcGoogle className="flex-shrink-0" />
            )}
            <span>{t("signInGoogle.buttonText")}</span>
          </Button>
          <div className="flex items-center w-full my-4">
            <div className="border-t border-primary/20 flex-grow" />
            <span className="text-center lg:text-sm text-xs text-primary/40 mx-2">
              {t("signInMessage.orContinueWith")}
            </span>
            <div className="border-t border-primary/20 flex-grow" />
          </div>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    className="text-md mt-1 transition-all duration-200 mb-4 border-primary/10"
                    placeholder={t("signIn.form.emailPlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="pb-3" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    className="text-md transition-all duration-200 border-primary/10"
                    placeholder={t("signIn.form.passwordPlaceholder")}
                    type="password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Link href="reset-password" className="w-full text-right">
            <Button
              type="button"
              variant="link"
              className="mr-auto text-normal text-xs w-fit mt-.5 p-0 text-right text-primary/50 hover:text-primary/70"
            >
              {t("signIn.form.forgotPassword")}
            </Button>
          </Link>
          <div className="flex mt-3 w-full justify-center">
            <Button
              type="submit"
              variant="default"
              className="w-full h-12 mb-4 text-md"
              disabled={
                signInLoading || signUpLoading || !form.formState.isValid
              }
            >
              {signInLoading || signUpLoading ? (
                <Spinner />
              ) : (
                t("signIn.form.submit")
              )}
            </Button>
          </div>
          {(error || googleError) && (
            <span className="mt-1 text-destructive text-sm">
              {t(mapFirebaseErrorMessage(error || googleError!))}
            </span>
          )}
        </form>
      </Form>
      <div className="text-primary/50 mb-6 text-md">
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

export default SignInPage;
