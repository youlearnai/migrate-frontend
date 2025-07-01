"use client";
import { useTranslation } from "react-i18next";
import { PiCardsBold } from "react-icons/pi";
import { FeatureMentionItem } from "./types";
import {
  BookOpenCheck,
  LineChart,
  ChartColumnIncreasing,
  Workflow,
  PieChart,
} from "lucide-react";
import { TbTimeline } from "react-icons/tb";
import { MdOutlineJoinInner } from "react-icons/md";
import { RiMindMap } from "react-icons/ri";

export const useEducationOptions = () => {
  const { t } = useTranslation();
  return [
    {
      value: "secondary or high school",
      label: t("educationOptions.secondaryOrHighSchool"),
    },
    {
      value: "undergraduate university",
      label: t("educationOptions.undergraduateUniversity"),
    },
    {
      value: "graduate university",
      label: t("educationOptions.graduateUniversity"),
    },
    { value: "post doctorate", label: t("educationOptions.postDoctorate") },
  ];
};

export const useLanguageOptions = () => {
  const { t } = useTranslation();
  return [
    {
      value: "english",
      label: t("languageOptions.english"),
      locale: "en",
      flag: "🇺🇸 🇬🇧",
    },
    {
      value: "hindi",
      label: t("languageOptions.hindi"),
      locale: "hi",
      flag: "🇮🇳",
    },
    {
      value: "afrikaans",
      label: t("languageOptions.afrikaans"),
      locale: "af",
      flag: "🇿🇦",
    },
    {
      value: "arabic",
      label: t("languageOptions.arabic"),
      locale: "ar",
      flag: "🇦🇪",
    },
    {
      value: "bengali",
      label: t("languageOptions.bengali"),
      locale: "bn",
      flag: "🇧🇩",
    },
    {
      value: "bulgarian",
      label: t("languageOptions.bulgarian"),
      locale: "bg",
      flag: "🇧🇬",
    },
    {
      value: "chinese",
      label: t("languageOptions.chinese"),
      locale: "zh",
      flag: "🇨🇳",
    },
    {
      value: "chinese_traditional_hant",
      label: t("languageOptions.chineseTraditionalHant"),
      locale: "zh-HANT",
      flag: "🇹🇼",
    },
    {
      value: "czech",
      label: t("languageOptions.czech"),
      locale: "cs",
      flag: "🇨🇿",
    },
    {
      value: "danish",
      label: t("languageOptions.danish"),
      locale: "da",
      flag: "🇩🇰",
    },
    {
      value: "dutch",
      label: t("languageOptions.dutch"),
      locale: "nl",
      flag: "🇳🇱",
    },
    {
      value: "finnish",
      label: t("languageOptions.finnish"),
      locale: "fi",
      flag: "🇫🇮",
    },
    {
      value: "french",
      label: t("languageOptions.french"),
      locale: "fr",
      flag: "🇫🇷",
    },
    {
      value: "german",
      label: t("languageOptions.german"),
      locale: "de",
      flag: "🇩🇪",
    },
    {
      value: "greek",
      label: t("languageOptions.greek"),
      locale: "el",
      flag: "🇬🇷",
    },
    {
      value: "hebrew",
      label: t("languageOptions.hebrew"),
      locale: "he",
      flag: "🇮🇱",
    },
    {
      value: "hungarian",
      label: t("languageOptions.hungarian"),
      locale: "hu",
      flag: "🇭🇺",
    },
    {
      value: "icelandic",
      label: t("languageOptions.icelandic"),
      locale: "is",
      flag: "🇮🇸",
    },
    {
      value: "indonesian",
      label: t("languageOptions.indonesian"),
      locale: "id",
      flag: "🇮🇩",
    },
    {
      value: "italian",
      label: t("languageOptions.italian"),
      locale: "it",
      flag: "🇮🇹",
    },
    {
      value: "japanese",
      label: t("languageOptions.japanese"),
      locale: "ja",
      flag: "🇯🇵",
    },
    {
      value: "korean",
      label: t("languageOptions.korean"),
      locale: "ko",
      flag: "🇰🇷",
    },
    {
      value: "lithuanian",
      label: t("languageOptions.lithuanian"),
      locale: "lt",
      flag: "🇱🇹",
    },
    {
      value: "malay",
      label: t("languageOptions.malay"),
      locale: "ms",
      flag: "🇲🇾",
    },
    {
      value: "nepali",
      label: t("languageOptions.nepali"),
      locale: "ne",
      flag: "🇳🇵",
    },
    {
      value: "norwegian",
      label: t("languageOptions.norwegian"),
      locale: "no",
      flag: "🇳🇴",
    },
    {
      value: "polish",
      label: t("languageOptions.polish"),
      locale: "pl",
      flag: "🇵🇱",
    },
    {
      value: "portuguese",
      label: t("languageOptions.portuguese"),
      locale: "pt",
      flag: "🇵🇹",
    },
    {
      value: "portuguese_brazil",
      label: t("languageOptions.portugueseBrazil"),
      locale: "pt-BR",
      flag: "🇧🇷",
    },
    {
      value: "romanian",
      label: t("languageOptions.romanian"),
      locale: "ro",
      flag: "🇷🇴",
    },
    {
      value: "russian",
      label: t("languageOptions.russian"),
      locale: "ru",
      flag: "🇷🇺",
    },
    {
      value: "slovak",
      label: t("languageOptions.slovak"),
      locale: "sk",
      flag: "🇸🇰",
    },
    {
      value: "spanish",
      label: t("languageOptions.spanish"),
      locale: "es-ES",
      flag: "🇪🇸",
    },
    {
      value: "swedish",
      label: t("languageOptions.swedish"),
      locale: "sv",
      flag: "🇸🇪",
    },
    {
      value: "tagalog",
      label: t("languageOptions.tagalog"),
      locale: "tl",
      flag: "🇵🇭",
    },
    {
      value: "turkish",
      label: t("languageOptions.turkish"),
      locale: "tr",
      flag: "🇹🇷",
    },
    {
      value: "urdu",
      label: t("languageOptions.urdu"),
      locale: "ur",
      flag: "🇵🇰",
    },
    {
      value: "vietnamese",
      label: t("languageOptions.vietnamese"),
      locale: "vi",
      flag: "🇻🇳",
    },
  ];
};

export const logos = [
  { src: "/universities/upenn.svg", alt: "upenn" },
  { src: "/universities/harvard.svg", alt: "harvard" },
  { src: "/universities/mit.svg", alt: "mit" },
  { src: "/universities/msu.svg", alt: "msu" },
  { src: "/universities/princeton.svg", alt: "princeton" },
  { src: "/universities/stanford.svg", alt: "stanford" },
  { src: "/universities/uofm.svg", alt: "uofm" },
  { src: "/universities/brown.svg", alt: "brown" },
];

export const useFeedbackOptions = () => {
  const { t } = useTranslation();
  return [
    { value: t("feedbackOptions.struggling") },
    { value: t("feedbackOptions.love") },
    { value: t("feedbackOptions.wishFeature") },
    { value: t("feedbackOptions.foundBug") },
    { value: t("feedbackOptions.overallThoughts") },
    { value: t("feedbackOptions.somethingElse") },
  ];
};

export const useProPlanConstants = () => {
  const { t } = useTranslation();
  return {
    PRO_PLAN_SPACES: t("proPlanConst.spaces"),
    PRO_PLAN_MESSAGES: t("proPlanConst.messages"),
    PRO_PLAN_CONTENTS: t("proPlanConst.contents"),
    PRO_PLAN_PDFS: t("proPlanConst.pdfs"),
  };
};

export enum TierLimitService {
  // User Services
  get_spaces = "service.error.get_spaces",
  get_content_history = "service.error.get_content_history",
  get_profile = "service.error.get_profile",
  update_profile = "service.error.update_profile",

  // Space Services
  add_space = "service.error.add_space",
  clone_space = "service.error.clone_space",
  delete_space = "service.error.delete_space",
  update_space = "service.error.update_space",
  get_space = "service.error.get_space",
  add_users_to_space = "service.error.add_users_to_space",
  update_space_users = "service.error.update_space_users",
  edit_space_content = "service.error.edit_space_content",

  // Content Services
  add_content_in_space = "service.error.add_content_in_space",
  add_content_in_space_interval = "service.error.add_content_in_space_interval",
  add_content_no_space = "service.error.add_content_no_space",
  add_content_no_space_interval = "service.error.add_content_no_space_interval",
  pdf_page_count = "service.error.pdf_page_count",
  start_stt = "service.error.start_stt",
  start_stt_interval = "service.error.start_stt_interval",
  delete_content = "service.error.delete_content",
  get_content = "service.error.get_content",
  get_content_flashcards = "service.error.get_content_flashcards",
  content_flashcards_preview = "service.error.content_flashcards_preview",

  // AI Services
  generate_content_summary = "service.error.generate_content_summary",
  generate_content_summary_v2 = "service.error.generate_content_summary_v2",
  generate_content_detailed_summary = "service.error.generate_content_detailed_summary",
  generate_content_detailed_summary_interval = "service.error.generate_content_detailed_summary_interval",
  generate_content_custom_summary = "service.error.generate_content_custom_summary",
  generate_content_custom_summary_interval = "service.error.generate_content_custom_summary_interval",
  generate_summary_range = "service.error.generate_summary_range",
  generate_summary_range_interval = "service.error.generate_summary_range_interval",
  generate_content_para_summary = "service.error.generate_content_para_summary",
  generate_space_summary = "service.error.generate_space_summary",
  generate_content_chat_prompts = "service.error.generate_content_chat_prompts",
  generate_space_chat_prompts = "service.error.generate_space_chat_prompts",
  generate_content_flashcards = "service.error.generate_content_flashcards",
  generate_content_article = "service.error.generate_content_article",
  generate_question_answer = "service.error.generate_question_answer",
  generate_question_answer_interval = "service.error.generate_question_answer_interval",
  regenerate_questions = "service.error.regenerate_questions",

  // Exam
  create_exam = "service.error.create_exam",
  create_exam_interval = "service.error.create_exam_interval",
  retry_exam = "service.error.retry_exam",

  // Chat Services
  get_chat_history = "service.error.get_chat_history",
  chat = "service.error.chat",
  chat_interval = "service.error.chat_interval",
  chat_agentic = "service.error.chat_agentic",
  chat_agentic_interval = "service.error.chat_agentic_interval",
  chat_voice = "service.error.chat_voice",
  chat_voice_interval = "service.error.chat_voice_interval",

  // Upload Services
  upload_content = "service.error.upload_content",
  upload_content_size = "service.error.upload_content_size",
  upload_chat_image = "service.error.upload_chat_image",
}

export const FLASHCARD_RATINGS = {
  AGAIN: 1,
  HARD: 2,
  GOOD: 3,
  EASY: 4,
} as const;

export const useFlashcardRatings = () => {
  const { t } = useTranslation();
  return [
    {
      label: t("flashcards.again", "Again"),
      rating: FLASHCARD_RATINGS.AGAIN,
    },
    {
      label: t("flashcards.hard", "Hard"),
      rating: FLASHCARD_RATINGS.HARD,
    },
    {
      label: t("flashcards.good", "Good"),
      rating: FLASHCARD_RATINGS.GOOD,
    },
    {
      label: t("flashcards.easy", "Easy"),
      rating: FLASHCARD_RATINGS.EASY,
    },
  ];
};

export const useFeatureMentions = (): FeatureMentionItem[] => {
  const { t } = useTranslation();

  return [
    {
      id: "quiz",
      display: t("popover.quiz"),
      logo: BookOpenCheck,
      description: t("featureMentions.quiz"),
      color: "#EF4444",
    },
    {
      id: "flashcards",
      display: t("featureMentions.flashcardsDisplay"),
      logo: PiCardsBold,
      description: t("featureMentions.flashcards"),
      color: "#EAB308",
    },
    {
      id: "timeline",
      display: t("featureMentions.timelineDisplay"),
      logo: TbTimeline,
      description: t("featureMentions.timeline"),
      color: "#3CB371",
    },
    {
      id: "bar-chart",
      display: t("featureMentions.barChartDisplay"),
      logo: ChartColumnIncreasing,
      description: t("featureMentions.barChart"),
      color: "#EC4899",
    },
    {
      id: "line-chart",
      display: t("featureMentions.lineChartDisplay"),
      logo: LineChart,
      description: t("featureMentions.lineChart"),
      color: "#3B82F6",
    },
    {
      id: "pie-chart",
      display: t("featureMentions.pieChartDisplay"),
      logo: PieChart,
      description: t("featureMentions.pieChart"),
      color: "#14B8A6",
    },
    {
      id: "venn-diagram",
      display: t("featureMentions.vennDiagramDisplay"),
      logo: MdOutlineJoinInner,
      description: t("featureMentions.vennDiagram"),
      color: "#F97316",
    },
    {
      id: "flowchart",
      display: t("featureMentions.flowchartDisplay"),
      logo: Workflow,
      description: t("featureMentions.flowchart"),
      color: "#3CB371",
    },
    {
      id: "mind-map",
      display: t("featureMentions.mindMapDisplay"),
      logo: RiMindMap,
      description: t("featureMentions.mindMap"),
      color: "#9333EA",
    },
  ];
};
