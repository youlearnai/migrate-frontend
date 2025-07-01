export async function getAssemblyToken(): Promise<string | undefined> {
  const response = await fetch("/api/assembly", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  const responseBody = await response.json();
  const token = responseBody.token;
  return token;
}

export const transcribeAudio = async (
  audioBlob: Blob,
): Promise<{ text: string; id: string; status: string }> => {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.wav");

  const response = await fetch("/api/transcribe", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to transcribe audio");
  }

  return response.json();
};
