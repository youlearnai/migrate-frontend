import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export const LoadingDots = ({
  message,
  customFunFacts,
}: {
  message: string;
  customFunFacts?: string[];
}) => {
  const [dots, setDots] = useState("");
  const [funFact, setFunFact] = useState("");
  const { t } = useTranslation();

  useEffect(() => {
    const funFacts = customFunFacts || [
      t("studyGuide.funFacts.1"),
      t("studyGuide.funFacts.2"),
      t("studyGuide.funFacts.3"),
      t("studyGuide.funFacts.4"),
      t("studyGuide.funFacts.5"),
      t("studyGuide.funFacts.6"),
      t("studyGuide.funFacts.7"),
    ];

    setFunFact(funFacts[0]);

    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);

    const factInterval = setInterval(() => {
      setFunFact((prev) => {
        const currentIndex = funFacts.indexOf(prev);
        return funFacts[(currentIndex + 1) % funFacts.length];
      });
    }, 4000);

    return () => {
      clearInterval(dotsInterval);
      clearInterval(factInterval);
    };
  }, [t]);

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="text-xl font-medium text-primary animate-pulse">
        <span key={message}>{message}</span>
        <span key={dots}>{dots}</span>
      </div>
      <div
        key={funFact}
        className="text-sm text-muted-foreground max-w-md animate-fade-in transition-opacity duration-300"
      >
        {funFact}
      </div>
    </div>
  );
};
