import { customFetch } from "@/lib/custom-fetch";

export const upgradeModalEvent = async (
  user: string | undefined,
  email: string,
  path: string,
): Promise<boolean> => {
  const response = await customFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/event/upgrade_modal_open`,
    {
      method: "POST",
      body: JSON.stringify({
        user_id: user,
        path,
        email,
      }),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (response.status === 204) {
    return true;
  }

  return false;
};
