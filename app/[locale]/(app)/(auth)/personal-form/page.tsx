"use client";
import { auth } from "@/auth/config";
import PersonalizedForm, {
  PersonalizedFormSchemaType,
} from "@/components/global/personalized-form";
import { PersonalizedFormSkeleton } from "@/components/skeleton/personalized-form-skeleton";
import { useUpdateUser } from "@/query-hooks/user";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { useTranslation } from "react-i18next";
import { validateReturnUrl } from "@/lib/utils";

const PersonalForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = validateReturnUrl(searchParams.get("returnUrl") || "/");
  const { t } = useTranslation();
  const { mutate: updateProfile, isPending } = useUpdateUser();
  const [user, loading, authError] = useAuthState(auth);
  // const { data: userSpaces, isLoading: isUserSpacesLoading } = useUserSpaces();

  const handleSubmit = async (form: PersonalizedFormSchemaType) => {
    const data = {
      user_id: user?.uid!,
      email: user?.email!,
      full_name: form.name!,
      photo_url: user?.photoURL!,
      education_level: null,
      username: user
        ?.displayName!?.replace(/[^A-Za-z0-9]/g, "")
        .substring(0, 15)!,
      language: form.language!.toLowerCase(),
      interests: [],
      purpose: form.purpose,
      purposeDetail: form.purposeDetail,
      referralSource: form.referralSource,
      otherReferralSource: form.otherReferralSource,
    };

    updateProfile(
      {
        fullName: form.name!,
        educationLevel: null,
        photoURL: data.photo_url!,
        interests: [],
        language: data.language!.toLocaleLowerCase(),
        chatModelId: form.aiModel,
        purpose: form.purpose,
        purposeDetail: form.purposeDetail,
        referralSource: form.referralSource,
        otherReferralSource: form.otherReferralSource,
      },
      {
        onSuccess: () => {
          // const latestSpace = userSpaces?.[userSpaces?.length - 1];
          // if (latestSpace) {
          //   router.push(`/space/${latestSpace._id}`);
          // }
          router.push(returnUrl);
          if (localStorage.getItem("newUser") === "true") {
            localStorage.setItem("showOnboarding", "true");
          }
        },
      },
    );
  };

  if (loading)
    return (
      <div className="w-full h-[90vh] flex items-center justify-center">
        <div className="w-full min-w-96 max-w-md">
          <PersonalizedFormSkeleton />
        </div>
      </div>
    );

  return (
    <div className="flex items-center justify-center h-[90vh] w-full">
      <div className="space-y-2 flex flex-col min-w-96 w-full max-w-md items-center">
        <span className="text-lg text-center text-primary/80 dark:text-primary mb-6">
          <span key="translation-personalized-form-title">
            {t("personalizedForm.title")}
          </span>
        </span>
        <div className="flex mt-4 w-full">
          <PersonalizedForm handleSubmit={handleSubmit} isNewUser />
        </div>
      </div>
    </div>
  );
};

export default PersonalForm;
