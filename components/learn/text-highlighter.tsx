import React, { useEffect, useRef, useId, useMemo } from "react";
import { useSearchHighlightStore } from "@/hooks/use-search-highlight-store";
import Markdown from "@/components/global/markdown";

type TextHighlighterProps = {
  text: string;
  className?: string;
  isMarkdown?: boolean;
};

export const TextHighlighter: React.FC<TextHighlighterProps> = ({
  text,
  className,
  isMarkdown = false,
}) => {
  // Generate unique ID for this component instance
  const componentId = useId();
  const { searchQuery, activeMatchIndex, reportComponentMatches } =
    useSearchHighlightStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const highlightedElements = useRef<HTMLSpanElement[]>([]);

  // Count matches in the text - memoize to avoid recalculating unnecessarily
  const matchCount = useMemo(() => {
    if (!searchQuery || !text) return 0;

    try {
      const regex = new RegExp(
        searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "gi",
      );
      const matches = text.match(regex);
      return matches ? matches.length : 0;
    } catch (error) {
      console.error("Error counting matches:", error);
      return 0;
    }
  }, [searchQuery, text]);

  // Highlight search terms in text
  const highlightText = useMemo(() => {
    if (!searchQuery || !text) return text;

    try {
      // Simple case-insensitive search
      const regex = new RegExp(
        `(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
        "gi",
      );
      const parts = text.split(regex);

      if (parts.length === 1) return text;

      // Create highlighted elements
      return (
        <>
          {parts.map((part, i) => {
            if (i % 2 === 1) {
              // This is a match
              return (
                <span
                  key={i}
                  className="bg-[#7DFF97]/40 dark:bg-[#7DFF97]/60 text-neutral-900/100 px-0.5 rounded match-highlight"
                  ref={(el) => {
                    if (el) highlightedElements.current[Math.floor(i / 2)] = el;
                  }}
                >
                  {part}
                </span>
              );
            }
            return part;
          })}
        </>
      );
    } catch (error) {
      console.error("Error highlighting text:", error);
      return text;
    }
  }, [searchQuery, text]);

  // Update match count whenever search query or text changes
  useEffect(() => {
    reportComponentMatches(componentId, matchCount);

    // Cleanup when unmounted
    return () => {
      reportComponentMatches(componentId, 0);
    };
  }, [componentId, matchCount, reportComponentMatches]);

  // Handle active match highlighting
  useEffect(() => {
    if (!searchQuery || matchCount === 0) return;

    // Find the local active index
    let localActiveIndex = -1;
    const state = useSearchHighlightStore.getState();

    if (activeMatchIndex >= 0) {
      let runningCount = 0;

      // Find all component IDs in the store
      const componentIds = Object.keys(state.componentMatches);
      for (const id of componentIds) {
        if (id === componentId) {
          // If this is our component, calculate local index
          if (
            activeMatchIndex >= runningCount &&
            activeMatchIndex < runningCount + state.componentMatches[id]
          ) {
            localActiveIndex = activeMatchIndex - runningCount;
          }
          break;
        }
        // Add previous components' match counts
        runningCount += state.componentMatches[id];
      }
    }

    // Reset all highlights to default
    highlightedElements.current.forEach((el, idx) => {
      if (el) {
        if (idx === localActiveIndex) {
          el.className =
            "bg-[#7DFF97]/100 text-neutral-900/100 px-0.5 rounded match-highlight active";
          // Scroll active element into view (not smooth for better performance)
          el.scrollIntoView({ block: "nearest" });
        } else {
          el.className =
            "bg-[#7DFF97]/40 dark:bg-[#7DFF97]/60 text-neutral-900/100 px-0.5 rounded match-highlight";
        }
      }
    });
  }, [activeMatchIndex, searchQuery, componentId, matchCount]);

  if (isMarkdown) {
    return (
      <div ref={containerRef} className={className}>
        <Markdown>{text}</Markdown>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={className}>
      {searchQuery ? highlightText : text}
    </div>
  );
};
