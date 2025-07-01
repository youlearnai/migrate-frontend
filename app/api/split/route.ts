import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const groups = ["control", "signup_modal_061425", "show_usage_061925"];

const split = () => {
  const random = Math.random();
  const index = Math.floor(random * groups.length);
  return groups[index];
};

export async function GET() {
  const cookieStore = await cookies();
  const userCookieName = "anonymousUserId";
  const existingUserId = cookieStore.get(userCookieName);
  const existingSplitGroup = cookieStore.get("splitGroup");

  if (!existingUserId || !existingSplitGroup) {
    const uniqueId = crypto.randomUUID();

    cookieStore.set(userCookieName, uniqueId, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      domain:
        process.env.NODE_ENV === "production" ? ".youlearn.ai" : undefined,
    });

    const group = split();

    cookieStore.set("splitGroup", group, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      domain:
        process.env.NODE_ENV === "production" ? ".youlearn.ai" : undefined,
    });

    return NextResponse.json({ userId: uniqueId });
  }

  return NextResponse.json({ userId: existingUserId.value });
}
