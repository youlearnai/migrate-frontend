"use server";
import { firebaseAdmin } from "@/auth/server";
import { getQueryClient } from "@/lib/react-query";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, SESSION_COOKIE_MAX_AGE } from "@/lib/utils";

export async function createSession(idToken: string) {
  try {
    const sessionCookie = await firebaseAdmin.createSessionCookie(idToken, {
      expiresIn: SESSION_COOKIE_MAX_AGE * 1000,
    });

    const cookieStore = await cookies();

    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      expires: new Date(Date.now() + SESSION_COOKIE_MAX_AGE * 1000),
      path: "/",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      domain:
        process.env.NODE_ENV === "production" ? ".youlearn.ai" : undefined,
    });
  } catch (error) {
    console.error("Error creating session cookie:", error);
    throw error;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    expires: new Date(0),
    path: "/",
    domain: process.env.NODE_ENV === "production" ? ".youlearn.ai" : undefined,
  });
}

export async function getDecodedToken(token: string) {
  if (!token) return null;
  try {
    const decodedToken = await firebaseAdmin.verifySessionCookie(token);
    return decodedToken;
  } catch (error) {
    console.error("Error verifying session cookie:", error);
    return null;
  }
}

export async function getAuthData() {
  const queryClient = getQueryClient();
  const sessionCookie = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const cookieHeader = sessionCookie
    ? `${SESSION_COOKIE_NAME}=${sessionCookie}`
    : "";
  const decodedToken = await getDecodedToken(sessionCookie as string);
  return { queryClient, cookieHeader, decodedToken };
}
