import {
  LineChart,
  Workflow,
  Play,
  Mic,
  AudioLines,
  MessageSquareText,
  Text,
  FileText,
  Globe,
  Video,
  Youtube,
} from "lucide-react";

import {
  FeatureMentionItem,
  Content,
  EnhancedFeatureMentionItem,
  MentionItemType,
} from "./types";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  BoundingBoxData,
  Tier,
  ContentType,
  FileTypeConfig,
  InputType,
} from "./types";
import { FirebaseError } from "firebase/app";
import { PiCardsBold } from "react-icons/pi";
import { BackendError, FirebaseErrorMap } from "./types";
import { BookOpenCheck, ChartColumnIncreasing } from "lucide-react";
import { TbTimeline } from "react-icons/tb";
import { MdOutlineJoinInner } from "react-icons/md";
import { RiMindMap } from "react-icons/ri";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMilliseconds(time: number): string {
  const totalSeconds = time;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const formattedHours = hours < 10 ? `0${hours}` : hours.toString();
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes.toString();
  const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds.toString();

  if (hours > 0) {
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  } else {
    return `${formattedMinutes}:${formattedSeconds}`;
  }
}

export function checkStringType(str: string): "int" | "float" | "neither" {
  const num = parseFloat(str);
  if (isNaN(num) || str.trim() !== num.toString()) {
    return "neither";
  }

  if (Math.floor(num) === num) {
    return "int";
  } else {
    return "float";
  }
}

export function base64ToFile(
  base64String: string,
  filename: string,
  mimeType: string,
): File {
  const base64WithoutPrefix = base64String.replace(
    /^data:image\/\w+;base64,/,
    "",
  );

  const binaryString = window.atob(base64WithoutPrefix);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });

  return new File([blob], filename, { type: mimeType });
}

export function getWebsocketUrl() {
  return process.env.NEXT_PUBLIC_BACKEND_URL?.replace(
    process.env.NEXT_PUBLIC_BACKEND_URL?.startsWith("https")
      ? "https://"
      : "http://",
    process.env.NEXT_PUBLIC_BACKEND_URL?.startsWith("https")
      ? "wss://"
      : "ws://",
  );
}

export function convertStringToBbox(bbox: string): BoundingBoxData {
  const [left, top, width, height] = bbox.split(",").map(Number);
  return {
    left,
    top,
    width,
    height,
  };
}

export const logos = [
  { src: "/universities/stanford.svg", alt: "stanford" },
  { src: "/universities/uofm.svg", alt: "uofm" },
  { src: "/universities/harvard.svg", alt: "harvard" },
  { src: "/universities/msu.svg", alt: "msu" },
  { src: "/universities/mit.svg", alt: "mit" },
  { src: "/universities/princeton.svg", alt: "princeton" },
];

export const STUDENT_DISCOUNT_PERCENTAGE = 20;
export const REFUND_PERIOD_DAYS = 7;

export const PRO_RECORDING_MAX_DURATION_SECONDS = 6000;

export const UNLIMITED_TIERS = ["unlimited"];

export const HIGHEST_TIERS: Tier[] = ["unlimited", "pro", "team"];

export const PAID_TIERS: Tier[] = ["pro", "core", "unlimited", "plus", "team"];

export const isDocumentType = (type: ContentType): boolean => {
  const documentTypes: ContentType[] = [
    "pdf",
    "arxiv",
    "pptx",
    "docx",
    "text",
    "webpage",
  ];
  return documentTypes.includes(type);
};

export const isAudioType = (type: ContentType): boolean => {
  const audioTypes: ContentType[] = ["audio", "stt"];
  return audioTypes.includes(type);
};

export const isVideoType = (type: ContentType): boolean => {
  const videoTypes: ContentType[] = ["video", "youtube"];
  return videoTypes.includes(type);
};

export const FILE_TYPES: Record<string, FileTypeConfig> = {
  pdf: {
    accept: { pdf: "application/pdf" },
    description: "PDF",
    extensions: ["pdf"],
  },
  powerpoint: {
    accept: {
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    },
    description: "PPT",
    extensions: ["ppt", "pptx"],
  },
  docx: {
    accept: {
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    },
    description: "DOC",
    extensions: ["doc", "docx"],
  },
  text: {
    accept: { txt: "text/plain" },
    description: "TXT",
    extensions: ["txt"],
  },
  audio: {
    accept: {
      mp3: "audio/mpeg",
      wav: "audio/wav",
      ogg: "audio/ogg",
      m4a: "audio/x-m4a",
      webm: "audio/webm",
      mov: "audio/mov",
    },
    description: "Audio",
    extensions: ["mp3", "wav", "ogg", "m4a", "webm", "mov"],
  },
  video: {
    accept: {
      mp4: "video/mp4",
      webm: "video/webm",
      mpeg: "video/mpeg",
      avi: "video/avi",
      mov: "video/mov",
    },
    description: "Video",
    extensions: ["mp4", "webm", "mpeg", "avi", "mov"],
  },
  image: {
    accept: {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      bmp: "image/bmp",
      webp: "image/webp",
      svg: "image/svg+xml",
    },
    description: "Image",
    extensions: ["jpg", "jpeg", "png", "bmp", "webp", "svg"],
  },
};

export const IS_IMAGE_ACCEPT = (accept: string): boolean => {
  const imageAccepts = Object.values(FILE_TYPES.image.accept);
  return imageAccepts.includes(accept);
};

export const getAllowedFileAccepts = () => {
  return Object.values(FILE_TYPES).flatMap((type) =>
    Object.values(type.accept),
  );
};

export const getAllowedFileTypeDescriptions = () => {
  return Object.values(FILE_TYPES).flatMap((type) => type.description);
};

export const getAllowedFileExtensions = () => {
  return Object.values(FILE_TYPES).flatMap((type) => type.extensions);
};

export const mapExtensionToAccept = (extension: string): string | undefined => {
  const lowerExt = extension.toLowerCase();
  for (const key in FILE_TYPES) {
    const fileTypeConfig = FILE_TYPES[key];
    if (fileTypeConfig.extensions.includes(lowerExt)) {
      return fileTypeConfig.accept[lowerExt];
    }
  }
  return undefined;
};

export const SESSION_COOKIE_NAME = "user_session";
export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14 days

export const checkIsYoutubeLink = (input: string): boolean => {
  const youtubeRegex =
    /^@?(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/watch\?v=[a-zA-Z0-9_-]+(?:&[^&=#]*=[^&#]*)*|youtu\.be\/[a-zA-Z0-9_-]+(?:\?[^#]*)?)$/i;

  return youtubeRegex.test(input);
};

export const checkIsAllowedDocumentLink = (
  input: string,
):
  | {
      isAllowed: boolean;
      extension: string;
    }
  | false => {
  const extension = input.split(".").pop();
  if (extension && getAllowedFileExtensions().includes(extension)) {
    return {
      isAllowed: true,
      extension,
    };
  }

  return false;
};

export const checkIsWebLink = (input: string): boolean => {
  const webRegex =
    /^(?:(?:https?|ftp):\/\/)?(?:localhost|(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)|(?:[\w-]+\.)+[a-zA-Z0-9-]{2,})(?::\d+)?(?:\/[^\s]*)?(?:\?[^\s]*)?(?:#[^\s]*)?$/i;

  return webRegex.test(input);
};

export const categorizeInput = (input: string): InputType | null => {
  const isYoutubeLink = checkIsYoutubeLink(input);
  const isAllowedDocumentLink = checkIsAllowedDocumentLink(input);
  const isWebLink = checkIsWebLink(input);

  if (isYoutubeLink) {
    return "youtube";
  }
  if (isAllowedDocumentLink) {
    return "link";
  }
  if (isWebLink) {
    return "web";
  }

  return null;
};

export const aiModelsOptions = [
  {
    value: "3",
    name: "Default",
    description: "Default model for the chatbot.",
    tiers: ["free", ...PAID_TIERS],
    allowedImages: true,
  },
  {
    value: "5",
    name: "Gemini 2.5 Flash",
    description:
      "Google's Gemini Flash 2.5 excels at fast, long context conversations.",
    tiers: ["free", ...PAID_TIERS],
    allowedImages: true,
  },
  {
    value: "1",
    name: "Claude 3.7 Sonnet",
    description:
      "Anthropic's Claude 3.7 Sonnet ensures safe, reliable AI interactions for trustworthy conversations.",
    tiers: PAID_TIERS,
    allowedImages: true,
  },
  {
    value: "2",
    name: "GPT-4.1",
    description:
      "OpenAI's GPT-4o excels at generating human-like text for diverse applications like content creation and customer support.",
    tiers: PAID_TIERS,
    allowedImages: true,
  },
  {
    value: "4",
    name: "Gemini 2.5 Pro",
    description:
      "Google's Gemini 2.5 Pro is the most capable model with a large context window, ideal for complex reasoning and long-form content analysis.",
    tiers: PAID_TIERS,
    allowedImages: true,
  },
];

const firebaseErrorMessages: FirebaseErrorMap = {
  "auth/app-deleted": "The Firebase app has been deleted.",
  "auth/app-not-authorized":
    "This app is not authorized to use Firebase Authentication.",
  "auth/argument-error": "An invalid argument was provided.",
  "auth/invalid-api-key":
    "The API key is invalid. Please check your configuration.",
  "auth/invalid-user-token":
    "The user's credential is no longer valid. The user must sign in again.",
  "auth/network-request-failed":
    "A network error has occurred. Please try again later.",
  "auth/operation-not-allowed":
    "The requested authentication provider is disabled for this Firebase project.",
  "auth/requires-recent-login":
    "This operation is sensitive and requires recent authentication. Log in again before retrying this request.",
  "auth/too-many-requests":
    "We have blocked all requests from this device due to unusual activity. Try again later.",
  "auth/unauthorized-domain":
    "This domain is not authorized to perform this operation.",
  "auth/user-disabled":
    "The user account has been disabled by an administrator.",
  "auth/user-token-expired":
    "The user's credential is no longer valid. The user must sign in again.",
  "auth/web-storage-unsupported":
    "This browser is not supported or 3rd party cookies and data may be disabled.",
  "auth/email-already-in-use":
    "The email address is already in use by another account.",
  "auth/invalid-email": "The email address is badly formatted.",
  "auth/user-not-found":
    "There is no user record corresponding to this identifier. The user may have been deleted.",
  "auth/wrong-password":
    "The password is invalid or the user does not have a password.",
  "auth/invalid-verification-code": "The verification code is invalid.",
  "auth/invalid-verification-id": "The verification ID is invalid.",
  "auth/account-exists-with-different-credential":
    "An account already exists with the same email address but different sign-in credentials. Sign in using a provider associated with this email address.",
  "auth/credential-already-in-use":
    "This credential is already associated with a different user account.",
  "auth/invalid-credential":
    "Please sign up. The credential is invalid or has expired.",
  "auth/invalid-phone-number": "The phone number is invalid.",
  "auth/missing-phone-number": "The phone number is missing.",
  "auth/quota-exceeded":
    "The quota for this operation has been exceeded. Please try again later.",
  "auth/provider-already-linked":
    "This account is already linked to a provider of the same type.",
  "auth/provider-not-found": "No provider found for this request.",
  "auth/timeout": "The operation has timed out. Please try again.",
  "auth/invalid-action-code":
    "The action code is invalid. This can happen if the code is malformed, expired, or has already been used.",
  "auth/action-code-expired":
    "The action code has expired. Please request a new code.",
  "auth/invalid-password":
    "The password is invalid. It must be at least 6 characters long.",
  "auth/weak-password":
    "The password is too weak. Please choose a stronger password.",
  "auth/missing-email": "An email address must be provided.",
  "auth/missing-continue-uri":
    "A continue URL must be provided in the request.",
  "auth/invalid-continue-uri":
    "The continue URL provided in the request is invalid.",
  "auth/unauthorized-continue-uri":
    "The domain of the continue URL is not whitelisted. Please whitelist this domain in the Firebase console.",
};

export const mapFirebaseErrorMessage = (error: FirebaseError): string => {
  const errorCode = error.code || "";
  return (
    firebaseErrorMessages[errorCode] ||
    "An unknown error occurred. Please try again."
  );
};

export function isBackendError(error: unknown): error is BackendError {
  return typeof error === "object" && error !== null && "message" in error;
}

export function shuffleWithSeed<T>(arr: T[], seed?: number): T[] {
  if (!seed) return [...arr].sort(() => Math.random() - 0.5);

  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;

  const rand = () => (state = (state * 16807) % 2147483647) / 2147483647;

  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export const MIN_CONSECUTIVE_SOURCES_TO_COMBINE = 3;

export const MAX_FILES_FOR_CHAT = 3;
export const MAX_FILE_SIZE_FOR_CHAT = 10 * 1024 * 1024; // 10MB
export const MAX_SCREENSHOT_SIZE_FOR_CHAT = 5 * 1024 * 1024; // 5MB

export const isImageExtension = (extension: string): boolean => {
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"];
  return imageExtensions.includes(extension);
};

export const extractPlaylistId = (url: string): string | null => {
  const patterns = [
    /[?&]list=([a-zA-Z0-9_-]+)/,
    /\/playlist\?list=([a-zA-Z0-9_-]+)/,
    /^([a-zA-Z0-9_-]+)$/, // Direct playlist ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
};

export const checkIsPlaylistLink = (input: string): boolean => {
  const playlistRegex =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/playlist\?list=|youtu\.be\/.*&list=)([a-zA-Z0-9_-]+)/i;
  return playlistRegex.test(input);
};

export const validateReturnUrl = (url: string | null): string => {
  if (!url || typeof url !== "string" || url.trim() === "") {
    return "/";
  }

  const trimmedUrl = url.trim();

  if (trimmedUrl.length > 2048) {
    return "/";
  }

  const lowerUrl = trimmedUrl.toLowerCase();
  const dangerousProtocols = [
    "javascript:",
    "data:",
    "vbscript:",
    "file:",
    "ftp:",
    "blob:",
    "about:",
    "chrome:",
    "chrome-extension:",
    "moz-extension:",
  ];

  if (dangerousProtocols.some((protocol) => lowerUrl.startsWith(protocol))) {
    return "/";
  }

  const decodedUrl = decodeURIComponent(trimmedUrl).toLowerCase();
  if (dangerousProtocols.some((protocol) => decodedUrl.includes(protocol))) {
    return "/";
  }

  if (trimmedUrl.startsWith("/")) {
    if (trimmedUrl.startsWith("//")) {
      return "/";
    }

    try {
      new URL(trimmedUrl, "https://dummy.com");

      const suspiciousPatterns = [/\.\./, /@/, /\s/, /[\x00-\x1f\x7f]/];

      if (suspiciousPatterns.some((pattern) => pattern.test(trimmedUrl))) {
        return "/";
      }

      return trimmedUrl;
    } catch {
      return "/";
    }
  }

  if (trimmedUrl.includes("://")) {
    return "/";
  }

  return "/";
};

export const getContentTypeIcon = (type: ContentType) => {
  switch (type) {
    case "youtube":
      return Play;
    case "video":
      return Play;
    case "stt":
      return Mic;
    case "audio":
      return AudioLines;
    case "conversation":
      return MessageSquareText;
    case "webpage":
      return Globe;
    case "pdf":
    case "arxiv":
    case "pptx":
    case "docx":
    case "text":
    default:
      return Text;
  }
};

export const getContentTypeColor = (type: ContentType): string => {
  switch (type) {
    case "youtube":
      return "red";
    case "video":
      return "purple";
    case "stt":
      return "blue";
    case "audio":
      return "indigo";
    case "conversation":
      return "emerald";
    case "webpage":
      return "cyan";
    case "pdf":
    case "arxiv":
      return "orange";
    case "pptx":
    case "docx":
      return "violet";
    case "text":
    default:
      return "gray";
  }
};

export const getMentionItems = (
  featureMentions: FeatureMentionItem[],
  contextContents?: Content[],
): EnhancedFeatureMentionItem[] => {
  const result: EnhancedFeatureMentionItem[] = [];

  if (contextContents && contextContents.length > 0) {
    const contentSection = MENTION_SECTIONS.content;
    const contentMentions: EnhancedFeatureMentionItem[] = contextContents
      .map((content) => ({
        id: content.id || content._id || content.content_id,
        display: content.title,
        description: content.title,
        logo: getContentTypeIcon(content.type),
        color: getContentTypeColor(content.type),
        itemType: contentSection.type,
        sectionCssClass: contentSection.cssClass,
      }))
      .filter((item) => !!item.id);

    result.push(...contentMentions);
  }

  if (featureMentions.length > 0) {
    const toolSection = MENTION_SECTIONS.tool;
    const toolMentions: EnhancedFeatureMentionItem[] = featureMentions
      .map((item) => ({
        ...item,
        itemType: toolSection.type,
        sectionCssClass: toolSection.cssClass,
      }))
      .filter((item) => !!item.id);

    result.push(...toolMentions);
  }

  return result;
};

export const MENTION_SECTIONS = {
  content: {
    type: "content" as const,
    cssClass: "mention-content-first",
    headerText: "CONTENTS",
    order: 1,
  },
  tool: {
    type: "tool" as const,
    cssClass: "mention-tool-first",
    headerText: "TOOLS",
    order: 2,
  },
} as const;

export function getUniqueContextContentsFromChats(
  chats?: { context_contents?: Content[] }[],
): Content[] {
  if (!chats) return [];
  return Array.from(
    new Map(
      chats
        .flatMap((chat) => chat?.context_contents ?? [])
        .map((content) => [content.content_id, content]),
    ).values(),
  );
}

export async function generateTextHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}
