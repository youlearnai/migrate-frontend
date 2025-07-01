import { auth } from "@/auth/config";
import { useAuthState } from "react-firebase-hooks/auth";
import { hasCookie } from "cookies-next/client";
import { SESSION_COOKIE_NAME } from "@/lib/utils";

const useAuth = () => {
  const [user, loading, error] = useAuthState(auth);
  const hasSessionCookie = hasCookie(SESSION_COOKIE_NAME);

  if (user && !user.emailVerified) {
    return { user: null, loading, error };
  }

  if (!hasSessionCookie) {
    return { user: null, loading, error };
  }

  return { user, loading, error };
};

export default useAuth;
