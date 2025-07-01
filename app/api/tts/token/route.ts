import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const apiKey = process.env.CARTESIA_API_KEY;

    if (!apiKey) {
      console.error("CARTESIA_API_KEY not configured");
      return NextResponse.json(
        { error: "TTS service not configured" },
        { status: 500 },
      );
    }

    const tokenResponse = await fetch("https://api.cartesia.ai/access-token", {
      method: "POST",
      headers: {
        "Cartesia-Version": "2025-04-16",
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grants: {
          tts: true,
        },
        expires_in: 300,
      }),
    });

    if (!tokenResponse.ok) {
      console.error(
        "Failed to generate access token:",
        await tokenResponse.text(),
      );
      return NextResponse.json(
        { error: "Failed to generate access token" },
        { status: 500 },
      );
    }

    const { token } = await tokenResponse.json();

    const cartesiaVersion = "2025-04-16";

    const wsUrl = `wss://api.cartesia.ai/tts/websocket?api_key=${token}&cartesia_version=${cartesiaVersion}`;

    return NextResponse.json({
      wsUrl,
      issuedAt: Date.now(),
    });
  } catch (error) {
    console.error("Token generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 },
    );
  }
}
