import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let url: string = "";
  let mimeType: string = "";
  try {
    const body = await req.json().catch(() => {
      throw new Error("Invalid request body - JSON parsing failed");
    });

    if (!body.url) {
      throw new Error("URL is required in the request body");
    }

    url = body.url;
    mimeType = body.mimeType;

    const response = await fetch(url, {
      headers: {
        Accept: mimeType,
        "Content-Type": mimeType,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch file: ${response.status} ${response.statusText}`,
      );
    }

    const fileBuffer = await response.arrayBuffer();

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": mimeType,
        "Content-Length": fileBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    const baseError =
      error instanceof Error ? error.message : "Unknown error occurred";
    const cause =
      error instanceof Error && error.cause ? error.cause : undefined;
    const stack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        error: baseError,
        url,
        cause,
        stack,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
