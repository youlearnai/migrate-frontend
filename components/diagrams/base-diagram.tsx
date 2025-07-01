import React, { useRef, useCallback, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Expand, Download, X } from "lucide-react";
import { toPng } from "html-to-image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useTheme } from "next-themes";
import { useModalStore } from "@/hooks/use-modal-store";
import { ModalType, ModalData } from "@/lib/types";

export type BaseDiagramProps = {
  title: string;
  className?: string;
  children: React.ReactNode;
  renderDiagram?: () => React.ReactNode;
};

export const BaseDiagram: React.FC<BaseDiagramProps> = ({
  title,
  className,
  children,
  renderDiagram,
}) => {
  const { theme } = useTheme();
  const diagramRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const expandedDiagramRef = useRef<HTMLDivElement>(null);

  const handleDownloadPng = useCallback(async () => {
    if (diagramRef.current) {
      /*
       * ------------------------------------------------------------------
       * 1. Generic preparation – hide buttons so they do not appear in PNG.
       * ------------------------------------------------------------------
       */
      const originalButtons = diagramRef.current.querySelector(
        ".diagram-buttons",
      ) as HTMLElement;

      if (originalButtons) {
        originalButtons.style.display = "none";
      }

      /*
       * ------------------------------------------------------------------
       * 2. Expand elements that might be collapsed (e.g., timeline items)
       *    – this was the previous behaviour that we keep.
       * ------------------------------------------------------------------
       */
      const timelineWrappers = Array.from(
        diagramRef.current.querySelectorAll(
          ".timeline-wrapper",
        ) as NodeListOf<HTMLElement>,
      );
      const wrapperOriginalStyles = timelineWrappers.map((el) => ({
        element: el,
        maxHeight: el.style.maxHeight,
        overflowY: el.style.overflowY,
      }));

      // NEW: force all timeline items to show
      const timelineItems = Array.from(
        diagramRef.current.querySelectorAll(
          ".timeline-item",
        ) as NodeListOf<HTMLElement>,
      );
      const hiddenTimelineItems: HTMLElement[] = [];
      timelineItems.forEach((item) => {
        if (!item.classList.contains("timeline-item-show")) {
          hiddenTimelineItems.push(item);
          item.classList.add("timeline-item-show");
        }
      });

      // Force immediate visibility by overriding styles directly
      const itemOriginalStyles = timelineItems.map((item) => ({
        element: item,
        opacity: item.style.opacity,
        transform: item.style.transform,
        transition: item.style.transition,
      }));

      timelineItems.forEach((item) => {
        item.style.opacity = "1";
        item.style.transform = "translateY(0)";
        item.style.transition = "none";
      });

      timelineWrappers.forEach((el) => {
        el.style.maxHeight = "none";
        el.style.overflowY = "visible";
      });

      /*
       * ------------------------------------------------------------------
       * 3. NEW – Reset zoom/pan transforms so the full diagram becomes
       *    visible in the exported image (fixes issue with mind-map export).
       * ------------------------------------------------------------------
       * We search for the elements created by `react-zoom-pan-pinch` that
       * hold the CSS transform responsible for the current zoom / pan:
       * `.react-transform-component`. We temporarily remove those transforms
       * and make their wrappers (`.react-transform-wrapper`) large enough
       * to fit the *entire* untransformed content. Afterwards we restore all
       * original styles so the on-screen diagram remains untouched.
       */

      // Remove transform so content is at natural scale/position
      const transformComponents = Array.from(
        diagramRef.current.querySelectorAll(
          ".react-transform-component",
        ) as NodeListOf<HTMLElement>,
      );
      const transformComponentOriginalStyles = transformComponents.map(
        (el) => ({
          element: el,
          transform: el.style.transform,
          width: el.style.width,
          height: el.style.height,
        }),
      );

      transformComponents.forEach((el) => {
        el.style.transform = "none";
      });

      // Ensure wrappers show entire content
      const transformWrappers = Array.from(
        diagramRef.current.querySelectorAll(
          ".react-transform-wrapper",
        ) as NodeListOf<HTMLElement>,
      );
      const transformWrapperOriginalStyles = transformWrappers.map((el) => ({
        element: el,
        overflow: el.style.overflow,
        width: el.style.width,
        height: el.style.height,
      }));

      transformWrappers.forEach((wrapper) => {
        // Allow the content to dictate size
        wrapper.style.overflow = "visible";

        const inner = wrapper.querySelector(
          ".react-transform-component",
        ) as HTMLElement | null;
        if (inner) {
          const rect = inner.getBoundingClientRect();
          wrapper.style.width = `${rect.width}px`;
          wrapper.style.height = `${rect.height}px`;
        }
      });

      /*
       * ------------------------------------------------------------------
       * 3b. NEW – Ensure the *root* diagram element (`diagramRef.current`)
       *     is wide enough to accommodate the full content. Without this
       *     adjustment, very wide diagrams (e.g.
       *     horizontally-expanded mind maps) can still be clipped because
       *     the root element retains its original page-constrained width.
       * ------------------------------------------------------------------
       */

      const diagramOriginalInlineWidth = diagramRef.current.style.width;
      let maxContentWidth = 0;
      transformComponents.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width > maxContentWidth) {
          maxContentWidth = rect.width;
        }
      });

      // Fallback if no transformComponent was found or width is zero
      if (maxContentWidth === 0) {
        maxContentWidth = diagramRef.current.scrollWidth;
      }

      // Add 20px to the width for better spacing in the exported image
      diagramRef.current.style.width = `${maxContentWidth + 30}px`;

      // Also lift overflow clipping on any direct container with
      // `overflow-hidden` so the whole diagram is captured.
      const overflowHiddenContainers = Array.from(
        diagramRef.current.querySelectorAll(
          '[class*="overflow-hidden"]',
        ) as NodeListOf<HTMLElement>,
      );
      const overflowHiddenOriginal = overflowHiddenContainers.map((el) => ({
        element: el,
        overflow: el.style.overflow,
        height: el.style.height,
      }));

      overflowHiddenContainers.forEach((el) => {
        el.style.overflow = "visible";
        // Unconditionally clear any fixed height so html-to-image can capture
        // the full content. This is necessary because Tailwind utility
        // classes like `h-[600px]` apply height via CSS rules rather than
        // inline styles, making `el.style.height` an empty string.
        // Setting it here ensures we override such fixed heights for the
        // duration of the export.
        el.style.height = "auto";
      });

      try {
        const dataUrl = await toPng(diagramRef.current, {
          cacheBust: true,
          backgroundColor: theme === "dark" ? "#171717" : "#fafafa",
          pixelRatio: 2,
        });

        /* Restore every mutated style ------------------------------- */
        if (originalButtons) {
          originalButtons.style.display = "";
        }

        wrapperOriginalStyles.forEach(({ element, maxHeight, overflowY }) => {
          element.style.maxHeight = maxHeight;
          element.style.overflowY = overflowY;
        });

        transformComponentOriginalStyles.forEach(
          ({ element, transform, width, height }) => {
            element.style.transform = transform;
            element.style.width = width;
            element.style.height = height;
          },
        );

        transformWrapperOriginalStyles.forEach(
          ({ element, overflow, width, height }) => {
            element.style.overflow = overflow;
            element.style.width = width;
            element.style.height = height;
          },
        );

        overflowHiddenOriginal.forEach(({ element, overflow, height }) => {
          element.style.overflow = overflow;
          element.style.height = height;
        });

        // Restore timeline-item visibility states
        hiddenTimelineItems.forEach((item) => {
          item.classList.remove("timeline-item-show");
        });
        itemOriginalStyles.forEach(
          ({ element, opacity, transform, transition }) => {
            element.style.opacity = opacity;
            element.style.transform = transform;
            element.style.transition = transition;
          },
        );

        // Restore root diagram width
        diagramRef.current.style.width = diagramOriginalInlineWidth;

        const link = document.createElement("a");
        link.download = `${title || "diagram"}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        /* Restore styles on error as well --------------------------- */
        if (originalButtons) {
          originalButtons.style.display = "";
        }
        wrapperOriginalStyles.forEach(({ element, maxHeight, overflowY }) => {
          element.style.maxHeight = maxHeight;
          element.style.overflowY = overflowY;
        });

        transformComponentOriginalStyles.forEach(
          ({ element, transform, width, height }) => {
            element.style.transform = transform;
            element.style.width = width;
            element.style.height = height;
          },
        );

        transformWrapperOriginalStyles.forEach(
          ({ element, overflow, width, height }) => {
            element.style.overflow = overflow;
            element.style.width = width;
            element.style.height = height;
          },
        );

        overflowHiddenOriginal.forEach(({ element, overflow, height }) => {
          element.style.overflow = overflow;
          element.style.height = height;
        });

        // Restore timeline-item visibility states on error
        hiddenTimelineItems.forEach((item) => {
          item.classList.remove("timeline-item-show");
        });
        itemOriginalStyles.forEach(
          ({ element, opacity, transform, transition }) => {
            element.style.opacity = opacity;
            element.style.transform = transform;
            element.style.transition = transition;
          },
        );

        // Restore root diagram width on error as well
        diagramRef.current.style.width = diagramOriginalInlineWidth;

        console.error("Error generating PNG:", err);
      }
    }
  }, [title, theme]);

  const handleOpen = () => {
    setIsExpanded(true);
  };

  const handleClose = () => {
    setIsExpanded(false);
  };

  return (
    <>
      <div
        ref={diagramRef}
        className={cn(
          "w-full rounded-lg overflow-hidden bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 relative",
          className,
        )}
      >
        {title && (
          <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex justify-center">
            <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 text-center">
              {title}
            </h3>
          </div>
        )}
        <div className="p-4 flex items-center justify-center">{children}</div>
        <div className="diagram-buttons flex absolute top-2 right-2 gap-1">
          <Button
            variant="ghost"
            size="messageIcon"
            className="rounded-sm"
            onClick={handleDownloadPng}
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="messageIcon"
            className="rounded-sm"
            onClick={handleOpen}
          >
            <Expand className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Dialog open={isExpanded} onOpenChange={handleClose}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-neutral-50 dark:bg-neutral-900 [&>button]:hidden rounded-lg">
          <DialogTitle className="sr-only">{title || "Diagram"}</DialogTitle>
          <div className="relative w-full h-full overflow-hidden bg-neutral-50 dark:bg-neutral-900 rounded-lg">
            {/* Title in expanded modal */}
            {title && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 text-center">
                  {title}
                </h3>
              </div>
            )}

            <div className="absolute top-4 right-4 z-10 flex gap-1">
              <Button
                variant="ghost"
                size="messageIcon"
                className="rounded-sm"
                onClick={handleDownloadPng}
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="messageIcon"
                className="rounded-sm"
                onClick={handleClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div
              ref={expandedDiagramRef}
              className="w-full h-full overflow-auto p-16 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center"
            >
              {renderDiagram ? (
                renderDiagram()
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-muted-foreground">
                      Diagram preview not available
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Close this modal to view the diagram
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
