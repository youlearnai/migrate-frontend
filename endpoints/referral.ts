import { ReferralCode } from "@/lib/types";

export const getReferralCode = async (
  userId: string,
): Promise<ReferralCode | null> => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/referral/${userId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: userId === "anonymous" ? "omit" : "include",
    },
  );

  const data: ReferralCode = await response.json();
  return data;
};

export const generateReferralCode = async (
  userId: string,
): Promise<ReferralCode> => {
  const data = {
    user_id: userId,
  };
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/referral/generate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: userId === "anonymous" ? "omit" : "include",
      body: JSON.stringify(data),
    },
  );
  const referralCode: ReferralCode = await response.json();
  return referralCode;
};
