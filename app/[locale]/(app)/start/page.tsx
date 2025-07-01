import { getAuthData } from "@/app/actions/auth";
import { redirect } from "next/navigation";

const StartPage = async () => {
  let redirectPath = "/signin";

  try {
    const { decodedToken } = await getAuthData();

    if (decodedToken?.uid) {
      redirectPath = "/";
    }
  } catch (error) {
    console.error("Authentication error:", error);
  }

  redirect(redirectPath);
};

export default StartPage;
