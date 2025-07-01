"use client";
import StackingCards, {
  StackingCardItem,
  useStackingCardsContext,
} from "@/components/ui/stacking-cards";
import { useNewFeatureStore } from "@/hooks/use-new-feature-store";
import { useModalStore } from "@/hooks/use-modal-store";
import { NewFeature } from "@/lib/types";
import { Button } from "../ui/button";
import { useTranslation } from "react-i18next";
import { useState, useRef } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

export const NewFeatureCards = () => {
  const { getActiveFeatures, dismissFeature } = useNewFeatureStore();
  const activeFeatures = getActiveFeatures();

  if (activeFeatures.length === 0) {
    return null;
  }

  const handleDismiss = (featureId: string) => {
    dismissFeature(featureId);
  };

  const dynamicHeight = 210 + (activeFeatures.length - 1) * 8;

  return (
    <StackingCards
      totalCards={activeFeatures.length}
      className="h-full w-full"
      style={{
        height: `${dynamicHeight}px`,
      }}
    >
      {activeFeatures.map((feature, index) => (
        <StackingCardItem key={feature.id} index={index}>
          <NewFeatureCard
            feature={feature}
            index={index}
            onDismiss={handleDismiss}
          />
        </StackingCardItem>
      ))}
    </StackingCards>
  );
};

export const NewFeatureCard = ({
  feature,
  index,
  onDismiss,
}: {
  feature: NewFeature;
  index: number;
  onDismiss: (featureId: string) => void;
}) => {
  const { t } = useTranslation();
  const { setVisibleCards, isActiveCard } = useStackingCardsContext();
  const { onOpen } = useModalStore();
  const isActive = isActiveCard(index);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleDismiss = () => {
    setVisibleCards((prev) => prev.filter((i) => i !== index));
    if (onDismiss) onDismiss(feature.id);
  };

  const handleCardClick = () => {
    handleOpenModal();
  };

  const handleOpenModal = () => {
    onOpen("newFeature", { feature, handleDismiss });
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  return (
    <div
      className="h-full shadow-sm flex flex-col p-3 pb-2 w-full rounded-lg border bg-card text-card-foreground mx-auto relative cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="flex-1 flex flex-col justify-center">
        {isActive && (
          <>
            <h3 className="font-medium text-sm mb-0.5 leading-tight line-clamp-1">
              {t(feature.title)}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {t(feature.description)}
            </p>
          </>
        )}
      </div>

      {feature.mediaSrc && (
        <div className="w-full h-16 rounded-lg mt-4 relative overflow-hidden bg-muted/20 group">
          <video
            ref={videoRef}
            src={feature.mediaSrc}
            className="object-cover w-full h-full rounded-lg"
            muted
            loop
            onPlay={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsPlaying(true);
            }}
            onPause={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsPlaying(false);
            }}
            onEnded={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsPlaying(false);
            }}
          />
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute inset-0 w-full h-full bg-black/20 transition-opacity duration-200 rounded-lg hover:bg-black/30",
              isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100",
            )}
          >
            <Play className="w-6 h-6 text-white" />
          </Button>
        </div>
      )}

      {isActive && (
        <div className="flex gap-2 mt-4 justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="w-fit text-muted-foreground text-xs h-fit p-2"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleDismiss();
            }}
          >
            {t("dismiss")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-fit text-muted-foreground text-xs h-fit p-2"
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
          >
            {t("learnMore")}
          </Button>
        </div>
      )}
    </div>
  );
};
