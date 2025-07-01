import React, { useEffect, useRef } from "react";
import { TimelineData } from "@/lib/diagrams/types";
import { BaseDiagram } from "./base-diagram";
import { cn } from "@/lib/utils";

type TimelineProps = {
  data: TimelineData;
  className?: string;
};

export const Timeline: React.FC<TimelineProps> = ({ data, className }) => {
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const expandedItemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.15,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("timeline-item-show");
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    itemRefs.current.forEach((item) => {
      if (item) observer.observe(item);
    });

    return () => {
      itemRefs.current.forEach((item) => {
        if (item) observer.unobserve(item);
      });
    };
  }, [data.events]);

  const renderTimelineContent = (isExpanded = false) => (
    <div className={cn("relative w-full", isExpanded && "self-start mt-20")}>
      {data.events.length === 0 ? (
        <div className="text-center py-8 text-neutral-500">
          No events to display
        </div>
      ) : (
        <div
          className={cn(
            "timeline-wrapper relative scrollbar-hide",
            isExpanded
              ? "h-full overflow-y-auto overflow-x-hidden"
              : "max-h-[600px] overflow-y-auto overflow-x-hidden",
          )}
        >
          <div
            className={cn(
              "timeline-container relative mx-auto px-6",
              isExpanded ? "max-w-5xl" : "max-w-4xl",
            )}
          >
            {/* Vertical line - desktop: center, mobile: left */}
            <div className="timeline-line absolute inset-y-0 left-8 md:left-1/2 md:-translate-x-1/2 w-px bg-neutral-200 dark:bg-neutral-700" />

            {/* Events */}
            <div className="relative">
              {data.events.map((event, index) => (
                <div
                  key={`event-${index}`}
                  ref={(el) => {
                    if (isExpanded) {
                      expandedItemRefs.current[index] = el;
                    } else {
                      itemRefs.current[index] = el;
                    }
                  }}
                  className={cn(
                    "timeline-item relative w-full md:w-1/2 px-10 md:px-12 py-6",
                    isExpanded
                      ? "timeline-item-show"
                      : "opacity-0 translate-y-6 transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                    "motion-reduce:opacity-100 motion-reduce:translate-y-0 motion-reduce:transition-none",
                    index % 2 === 0
                      ? "md:left-0 md:text-right md:pr-12"
                      : "md:left-1/2 md:text-left md:pl-12",
                  )}
                >
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      "timeline-dot absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5",
                      "bg-white dark:bg-neutral-900 border-[1.5px] border-neutral-400 dark:border-neutral-600",
                      "rounded-full z-10 transition-[border-color] duration-300 delay-200",
                      index % 2 === 0
                        ? "left-[30px] md:left-auto md:right-[-5px]"
                        : "left-[30px] md:left-[-5px]",
                    )}
                  />

                  {/* Event card */}
                  <div
                    className={cn(
                      "timeline-card inline-block w-full",
                      !isExpanded && "max-w-[420px]",
                      "bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700",
                      "rounded-xl px-7 py-6 shadow-sm",
                      "transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                      "hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-md dark:hover:shadow-lg",
                      "motion-reduce:transition-none",
                    )}
                  >
                    {/* Date badge */}
                    <span className="inline-block text-xs font-medium tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
                      {event.date}
                    </span>

                    {/* Title */}
                    {event.title && (
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3 leading-tight tracking-tight">
                        {event.title}
                      </h3>
                    )}

                    {/* Description */}
                    {event.description && (
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <BaseDiagram
      title={data.title}
      className={className}
      renderDiagram={() => renderTimelineContent(true)}
    >
      {renderTimelineContent(false)}
    </BaseDiagram>
  );
};
