import React, { useRef, useState, useLayoutEffect } from "react";

const PDFHighlightPopover = ({
  selectionRegion,
  renderPopover,
  offset = { x: 0, y: 0 },
  zIndex = 90,
}: {
  selectionRegion: { left: number; top: number; width: number; height: number };
  renderPopover: () => React.ReactNode;
  offset?: { x: number; y: number };
  zIndex?: number;
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ left: number; top: number }>({
    left: 0,
    top: 0,
  });

  useLayoutEffect(() => {
    if (popoverRef.current) {
      const popoverRect = popoverRef.current.getBoundingClientRect();
      const containerRect =
        popoverRef.current.parentElement?.getBoundingClientRect();

      if (containerRect) {
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;

        let left = ((selectionRegion.left + offset.x) * containerWidth) / 100;
        let top =
          ((selectionRegion.top + selectionRegion.height + offset.y) *
            containerHeight) /
          100;

        if (left + popoverRect.width > containerWidth) {
          left = containerWidth - popoverRect.width;
        }
        if (left < 0) {
          left = 0;
        }

        if (top + popoverRect.height > containerHeight) {
          top =
            ((selectionRegion.top - popoverRect.height - offset.y) *
              containerHeight) /
            100;
          if (top < 0) {
            top = containerHeight - popoverRect.height;
          }
        }

        setPosition({ left, top });
      }
    }
  }, [selectionRegion, offset]);

  return (
    <div
      ref={popoverRef}
      style={{
        position: "absolute",
        left: `${position.left}px`,
        top: `${position.top}px`,
        zIndex: zIndex,
      }}
    >
      {renderPopover()}
    </div>
  );
};

export default PDFHighlightPopover;
