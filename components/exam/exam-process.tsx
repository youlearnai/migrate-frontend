import React, { useState, useEffect, useMemo } from "react";
import ProcessLoader, { ProcessPhase } from "../learn/process-loader";
import { useTranslation } from "react-i18next";

interface ExamProcessProps {
  className?: string;
  currentPhase?: number; // Optional: to control which phase is currently active (0-based index)
  autoProgress?: boolean; // Whether to automatically progress through phases
  onComplete?: () => void; // Optional callback when all phases complete
}

const ExamProcess: React.FC<ExamProcessProps> = ({
  className,
  currentPhase: externalPhase,
  autoProgress = true, // Default to auto-progress
  onComplete,
}) => {
  // Use internal state for phase if auto-progressing
  const [internalPhase, setInternalPhase] = useState(0);
  // Add state for ellipsis animation
  const [ellipsisDots, setEllipsisDots] = useState(1);
  const { t } = useTranslation();

  // Determine which phase state to use
  const currentPhase =
    externalPhase !== undefined ? externalPhase : internalPhase;

  // Use t() for phase labels
  const phases = useMemo(
    () => [
      {
        id: "preparing",
        label: (
          <span key={`translation-phase-preparing`}>
            {t("examProcess.phases.preparing")}
          </span>
        ),
      },
      {
        id: "analyzing",
        label: (
          <span key={`translation-phase-analyzing`}>
            {t("examProcess.phases.analyzing")}
          </span>
        ),
      },
      {
        id: "generating_questions",
        label: (
          <span key={`translation-phase-generating_questions`}>
            {t("examProcess.phases.generatingQuestions")}
          </span>
        ),
      },
      {
        id: "structuring",
        label: (
          <span key={`translation-phase-structuring`}>
            {t("examProcess.phases.structuring")}
          </span>
        ),
      },
      {
        id: "reviewing",
        label: (
          <span key={`translation-phase-reviewing`}>
            {t("examProcess.phases.reviewing")}
          </span>
        ),
      },
      {
        id: "finalizing",
        label: (
          <span key={`translation-phase-finalizing`}>
            {t("examProcess.phases.finalizing")}
          </span>
        ),
      },
    ],
    [t],
  );

  // Get visible phases based on current phase (show current phase and some before/after)
  const visiblePhases = useMemo(() => {
    // We'll show all phases, but will style them differently based on their distance from current
    return phases.map((phase, index) => {
      // Calculate distance from current phase (negative for past, positive for future)
      const distanceFromCurrent = index - currentPhase;

      // Determine status
      const status =
        currentPhase > index
          ? "completed"
          : currentPhase === index
            ? "in-progress"
            : "pending";

      return {
        ...phase,
        status,
        distanceFromCurrent,
      };
    });
  }, [phases, currentPhase]);

  // Define progressively longer durations for each phase (in milliseconds)
  const phaseDurations = [
    3000, // 3 seconds for preparing
    9000, // 5 seconds for analyzing
    18000, // 8 seconds for generating
    24000, // 10 seconds for structuring
    9000, // 12 seconds for reviewing
    100000, // 15 seconds for finalizing
  ];

  // Auto-progress effect - uses phaseDurations
  useEffect(() => {
    if (!autoProgress || externalPhase !== undefined) return;

    // If we're past the last phase, call onComplete and stop
    if (internalPhase >= phases.length) {
      onComplete?.();
      return;
    }

    // Get the duration for the current phase
    const currentDuration = phaseDurations[internalPhase] || 10000;

    // Set a timer to progress to the next phase using the specific duration
    const timer = setTimeout(() => {
      setInternalPhase((prev) => prev + 1);
    }, currentDuration);

    return () => clearTimeout(timer);
  }, [internalPhase, autoProgress, externalPhase, onComplete, phases.length]);

  // Effect for ellipsis animation interval
  useEffect(() => {
    const interval = setInterval(() => {
      setEllipsisDots((prev) => (prev % 3) + 1); // Cycle 1 -> 2 -> 3 -> 1
    }, 300); // Update every 300ms

    return () => clearInterval(interval); // Cleanup on unmount
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <div>
      <div className="flex flex-col items-center justify-center w-full h-full">
        {/* Custom phase display with centered in-progress phase */}
        <div className="w-full max-w-md mx-auto py-8 relative">
          <div className="flex flex-col items-center space-y-4">
            {visiblePhases.map((phase, index) => {
              // Calculate opacity based on distance from current phase
              const opacity =
                phase.distanceFromCurrent === 0
                  ? 100 // Current phase is fully visible
                  : Math.max(0, 100 - Math.abs(phase.distanceFromCurrent) * 30); // Fade out as distance increases

              // Calculate transform - this will now only apply to the text part
              const transform =
                phase.distanceFromCurrent === 0
                  ? "scale(1.00) translateX(0)"
                  : phase.distanceFromCurrent < 0
                    ? `scale(0.95))`
                    : `scale(0.95)`;

              return (
                <div
                  key={phase.id}
                  className="flex items-center gap-2 w-full "
                  style={{
                    opacity: `${opacity}%`,
                    position: "relative",
                    zIndex:
                      phase.distanceFromCurrent === 0
                        ? 10
                        : 5 - Math.abs(phase.distanceFromCurrent),
                  }}
                >
                  <div
                    key={`icon-container-${phase.id}`}
                    className={`
                        flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 flex-shrink-0
                        ${
                          phase.status === "completed"
                            ? "bg-green-500 text-white"
                            : phase.status === "in-progress"
                              ? "border-green-500 bg-green-100/80 dark:bg-green-950/30"
                              : "border-neutral-300 dark:border-neutral-700"
                        }
                    `}
                  >
                    {phase.status === "completed" ? (
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    ) : phase.status === "in-progress" ? (
                      <svg
                        className="h-5 w-5 text-green-500 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          strokeOpacity="0.25"
                          strokeWidth="4"
                        ></circle>
                        <path
                          d="M12 2a10 10 0 0 1 10 10"
                          strokeOpacity="0.75"
                        ></path>
                      </svg>
                    ) : (
                      <div className="h-5 w-5" />
                    )}
                  </div>
                  <div
                    key={`text-container-${phase.id}`}
                    className="flex-1 flex transition-all duration-500"
                    style={{ transform }}
                  >
                    <span
                      key={`label-span-${phase.id}`}
                      className={`
                        text-base transition-all duration-300 ml-2
                        ${
                          phase.status === "completed"
                            ? "text-primary/60"
                            : phase.status === "in-progress"
                              ? "text-primary font-medium"
                              : "text-neutral-500 dark:text-neutral-400"
                        }
                        `}
                    >
                      <span key={`label-text-${phase.id}`}>{phase.label}</span>
                      {phase.status === "in-progress" && (
                        <span
                          key={`ellipsis-${phase.id}`}
                          className="inline-flex min-w-[24px] text-left"
                        >
                          {".".repeat(ellipsisDots)}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamProcess;
