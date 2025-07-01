import { useErrorStore } from "@/hooks/use-error-store";
import { TierLimits, type CustomErrorType } from "@/lib/types";

export class CustomError extends Error {
  status: number;
  statusText: string;
  service?: keyof TierLimits;
  title?: string;

  constructor(errorData: CustomErrorType) {
    super(errorData.statusText || "An error occurred");
    this.name = "CustomError";
    this.status = errorData.status;
    this.statusText = errorData.statusText;
    this.service = errorData.service;
    if (errorData.message) {
      this.message = errorData.message;
    }
    this.title = errorData.title;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError);
    }
  }
}

export const customFetch = async (
  url: string,
  options: RequestInit,
  showModal: boolean = true,
  skipModalForStatuses: number[] = [],
  overrideModalForStatuses: number[] = [],
): Promise<Response> => {
  const openModal = useErrorStore.getState().openModal;

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const parsedBody = (await response.json()) as CustomErrorType;
      const errorData = {
        status: response.status,
        statusText: response.statusText,
        service: parsedBody.service,
        message: parsedBody.message,
        title: parsedBody.title,
      };
      throw new CustomError(errorData);
    }

    return response;
  } catch (error) {
    if (error instanceof CustomError) {
      const shouldSkipModal = skipModalForStatuses.includes(error.status);

      if (showModal && !shouldSkipModal) {
        openModal(
          error,
          { source: url },
          overrideModalForStatuses.includes(error.status),
        );
      }
      throw error;
    } else {
      throw error;
    }
  }
};
