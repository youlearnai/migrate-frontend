import { AssemblyAI } from "assemblyai";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ASSEMBLY_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "AssemblyAI API key not configured" },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return Response.json(
        { error: "No audio file provided" },
        { status: 400 },
      );
    }

    const assemblyClient = new AssemblyAI({ apiKey });

    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadUrl = await assemblyClient.files.upload(buffer);

    const transcript = await assemblyClient.transcripts.transcribe({
      audio: uploadUrl,
      speech_model: "best",
    });

    if (transcript.status === "error") {
      return Response.json({ error: transcript.error }, { status: 500 });
    }

    return Response.json({
      text: transcript.text,
      id: transcript.id,
      status: transcript.status,
    });
  } catch (error) {
    console.error("Transcription error:", error);
    return Response.json(
      { error: "Failed to transcribe audio" },
      { status: 500 },
    );
  }
}
