import { transcribeAudio } from "@/endpoints/stt";
import { useMutation } from "@tanstack/react-query";

export const useTranscribeAudio = () => {
  return useMutation({
    mutationFn: async (audioBlob: Blob) => {
      return await transcribeAudio(audioBlob);
    },
    mutationKey: ["transcribeAudio"],
  });
};
