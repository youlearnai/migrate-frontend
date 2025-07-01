import { TFunction } from "i18next";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Features, PricingLimit } from "./types";

export const validateToken = (num: number | null): string => {
  if (num === null) return "0";

  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(num % 1000000000 === 0 ? 0 : 1)}B`;
  } else if (num >= 1000000) {
    return `${(num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)}K`;
  }
  return num.toString();
};

export const validateInterval = (
  value: number | string | null,
  t: TFunction<"translation">,
): string | null => {
  if (value === null) return null;
  if (typeof value === "string") return value;

  if (value === 1) return t("day");
  if (value === 7) return t("week");
  if (value === 30) return t("month");
  return t("days", { count: value });
};

export const useFreePlanBenefits = (
  pricingLimit?: PricingLimit,
): Features[] => {
  const { t } = useTranslation();
  if (!pricingLimit) return [];

  const limits = pricingLimit.free;
  return [
    {
      icon: <Check className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 mr-4" />,
      label: t("freePlan.contents", {
        count: limits.add_content_in_space,
        interval: validateInterval(limits.add_content_in_space_interval, t),
      }),
    },
    {
      icon: <Check className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 mr-4" />,
      label: t("freePlan.messages", {
        count: limits.chat,
        learnPlus: limits.chat_agentic,
        interval: validateInterval(limits.chat_interval, t),
        agentic_interval: validateInterval(limits.chat_agentic_interval, t),
      }),
      tooltip: t("chatInput.accuracyModeTooltip"),
    },
    {
      icon: <Check className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 mr-4" />,
      label: t("freePlan.questionAnswer", {
        count: limits.generate_question_answer,
        interval: validateInterval(limits.generate_question_answer_interval, t),
      }),
    },
    {
      icon: <Check className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 mr-4" />,
      label: t("freePlanBenefits.exam", {
        count: limits.create_exam,
        interval: validateInterval(limits.create_exam_interval, t),
      }),
    },
    {
      icon: <Check className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 mr-4" />,
      label: t("freePlanBenefits.voice_mode", {
        count: limits.chat_voice,
        interval: validateInterval(limits.chat_voice_interval, t),
      }),
    },
    {
      icon: <Check className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 mr-4" />,
      label: t("freePlan.pdfLimit", {
        size: Math.round(limits.upload_content_size / 1024 / 1024),
        pageSize: limits.pdf_page_count,
      }),
    },
  ];
};

export const useCorePlanBenefits = (
  pricingLimit?: PricingLimit,
): Features[] => {
  const { t } = useTranslation();
  if (!pricingLimit) return [];

  const limits = pricingLimit.core;
  return [
    {
      icon: <Check className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 mr-4" />,
      label: t("corePlan.messages", {
        count: limits.chat,
        learnPlus: limits.chat_agentic,
        interval: validateInterval(limits.chat_interval, t),
        agentic_interval: validateInterval(limits.chat_agentic_interval, t),
      }),
      tooltip: t("chatInput.accuracyModeTooltip"),
    },
    {
      icon: <Check className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 mr-4" />,
      label: t("corePlan.contents", {
        count: limits.add_content_in_space,
        interval: validateInterval(limits.add_content_in_space_interval, t),
      }),
    },
    {
      icon: <Check className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 mr-4" />,
      label: t("corePlan.pdfLimit", {
        size: Math.round(limits.upload_content_size / 1024 / 1024),
      }),
    },
    {
      icon: <Check className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 mr-4" />,
      label: t("corePlan.questionAnswer", {
        count: limits.generate_question_answer,
        interval: validateInterval(limits.generate_question_answer_interval, t),
      }),
    },
    {
      icon: <Check className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 mr-4" />,
      label: t("corePlanBenefits.lectures", {
        count: limits.start_stt,
        interval: validateInterval(limits.start_stt_interval, t),
      }),
    },
    {
      icon: <Check className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 mr-4" />,
      label: t("proPlanBenefits.exam", {
        count: limits.create_exam,
        interval: validateInterval(limits.create_exam_interval, t),
      }),
    },
    // {
    //   icon: <Check className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 mr-4" />,
    //   label: t("corePlan.spaces", { count: CORE_PLAN_SPACES }),
    // },
  ];
};

export const useProPlanBenefits = (pricingLimit?: PricingLimit): Features[] => {
  const { t } = useTranslation();
  if (!pricingLimit) return [];

  const limits = pricingLimit.pro;
  return [
    {
      icon: <Check className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 mr-4" />,
      label: t("proPlanBenefits.contents"),
    },
    {
      icon: <Check className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 mr-4" />,
      label: t("proPlanBenefits.messages", {
        learnPlus: limits.chat_agentic,
        interval: validateInterval(limits.chat_interval, t),
        agentic_interval: validateInterval(limits.chat_agentic_interval, t),
      }),
      tooltip: t("chatInput.accuracyModeTooltip"),
    },
    {
      icon: <Check className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 mr-4" />,
      label: t("proPlanBenefits.questionAnswer", {
        count: limits.generate_question_answer,
        interval: validateInterval(limits.generate_question_answer_interval, t),
      }),
    },
    {
      icon: <Check className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 mr-4" />,
      label: t("proPlanBenefits.exam"),
    },
    {
      icon: <Check className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 mr-4" />,
      label: t("proPlanBenefits.voiceMode", {
        count: limits.chat_voice,
        interval: validateInterval(limits.chat_voice_interval, t),
      }),
    },
    {
      icon: <Check className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 mr-4" />,
      label: t("proPlanBenefits.pdfSizeLimit", {
        size: Math.round(limits.upload_content_size / 1024 / 1024),
        pageSize: limits.pdf_page_count,
      }),
    },
    {
      icon: <Check className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 mr-4" />,
      label: t("proPlanBenefits.prioritySupport"),
    },
  ];
};

export const usePlusPlanBenefits = (
  pricingLimit?: PricingLimit,
): Features[] => {
  const { t } = useTranslation();
  if (!pricingLimit) return [];

  const limits = pricingLimit.plus;

  if (!limits) return [];

  return [
    {
      icon: <Check className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 mr-4" />,
      label: t("plusPlanBenefits.contents", {
        count: limits.add_content_in_space,
        interval: validateInterval(limits.add_content_in_space_interval, t),
      }),
    },
    {
      icon: <Check className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 mr-4" />,
      label: t("plusPlanBenefits.messages", {
        count: limits.chat,
        learnPlus: limits.chat_agentic,
        interval: validateInterval(limits.chat_interval, t),
        agentic_interval: validateInterval(limits.chat_agentic_interval, t),
      }),
      tooltip: t("chatInput.accuracyModeTooltip"),
    },
    {
      icon: <Check className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 mr-4" />,
      label: t("plusPlanBenefits.questionAnswer", {
        count: limits.generate_question_answer,
        interval: validateInterval(limits.generate_question_answer_interval, t),
      }),
    },
    {
      icon: <Check className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 mr-4" />,
      label: t("plusPlanBenefits.exam", {
        count: limits.create_exam,
        interval: validateInterval(limits.create_exam_interval, t),
      }),
    },
    {
      icon: <Check className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 mr-4" />,
      label: t("plusPlanBenefits.pdfSizeLimit", {
        size: Math.round(limits.upload_content_size / 1024 / 1024),
        pageSize: limits.pdf_page_count,
      }),
    },
    {
      icon: <Check className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 mr-4" />,
      label: t("proPlanBenefits.voiceMode", {
        chat_voice: validateToken(limits.chat_voice),
        chat_voice_interval: validateInterval(limits.chat_voice_interval, t),
      }),
    },
  ];
};

export const useUnlimitedPlanBenefits = (
  pricingLimit?: PricingLimit,
): Features[] => {
  const { t } = useTranslation();
  if (!pricingLimit) return [];

  const limits = pricingLimit.unlimited;

  if (!limits) return [];
  return [
    {
      icon: <Check className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 mr-4" />,
      label: t("unlimitedPlan.contents"),
    },
    {
      icon: <Check className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 mr-4" />,
      label: t("unlimitedPlan.messages", {
        learnPlus: limits.chat_agentic,
        interval: validateInterval(limits.chat_interval, t),
        agentic_interval: validateInterval(limits.chat_agentic_interval, t),
      }),
      tooltip: t("chatInput.accuracyModeTooltip"),
    },
    {
      icon: <Check className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 mr-4" />,
      label: t("unlimitedPlan.questionAnswer"),
    },
    {
      icon: <Check className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 mr-4" />,
      label: t("unlimitedPlan.exam", {
        count: limits.create_exam,
        interval: validateInterval(limits.create_exam_interval, t),
      }),
    },
    {
      icon: <Check className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 mr-4" />,
      label: t("unlimitedPlan.pdfSizeLimit", {
        size: Math.round(limits.upload_content_size / 1024 / 1024),
        pageSize: limits.pdf_page_count,
      }),
    },
    {
      icon: <Check className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 mr-4" />,
      label: t("unlimitedPlan.voiceMode", {
        count: limits.chat_voice,
        interval: validateInterval(limits.chat_voice_interval, t),
      }),
    },
    {
      icon: <Check className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 mr-4" />,
      label: t("proPlanBenefits.prioritySupport"),
    },
  ];
};

export const useTeamPlanBenefits = (
  pricingLimit?: PricingLimit,
): Features[] => {
  const { t } = useTranslation();
  if (!pricingLimit) return [];

  return [
    {
      icon: <></>,
      label: t("teamPlan.usage", {
        plan: "Pro",
      }),
    },
    {
      icon: <Check className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 mr-4" />,
      label: t("teamPlan.centralized"),
    },
    {
      icon: <Check className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 mr-4" />,
      label: t("teamPlan.members"),
    },
    {
      icon: <Check className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 mr-4" />,
      label: t("teamPlan.customize"),
    },
    {
      icon: <Check className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 mr-4" />,
      label: t("teamPlan.collaborate"),
    },
  ];
};
