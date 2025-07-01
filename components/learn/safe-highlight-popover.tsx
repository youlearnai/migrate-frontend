import { useEffect } from "react";
import { HighlightPopover } from "@omsimos/react-highlight-popover";

type HighlightPopoverProps = React.ComponentProps<typeof HighlightPopover>;

// Monkey patch the Range.prototype.setEnd method to catch IndexSizeError
const patchRangePrototype = () => {
  if (typeof window === "undefined") return;

  const originalSetEnd = Range.prototype.setEnd;
  // Use a TypeScript workaround to add a custom property to a native method
  const setEndPatched = (originalSetEnd as any).__patched;
  if (!setEndPatched) {
    Range.prototype.setEnd = function (node, offset) {
      try {
        return originalSetEnd.call(this, node, offset);
      } catch (error: any) {
        if (error.name === "IndexSizeError") {
          // Get a truly safe offset for this node by using different strategies
          let safeOffset = 0;

          try {
            // First check if it's a text node
            if (node.nodeType === Node.TEXT_NODE && node.textContent) {
              // For text nodes, we can safely use the text length
              safeOffset = Math.min(offset, node.textContent.length);
            }
            // If it's an element node
            else if (node.nodeType === Node.ELEMENT_NODE) {
              // For element nodes, use the childNodes count
              safeOffset = Math.min(offset, node.childNodes.length);
            }

            console.warn(
              `Range.setEnd IndexSizeError prevented. Offset ${offset} adjusted to ${safeOffset}`,
            );

            return originalSetEnd.call(this, node, safeOffset);
          } catch (nestedError) {
            // If we still can't set the range, use a safer approach:
            // Create a new range at the start of the document
            console.warn(
              "Failed to apply safe offset, using fallback",
              nestedError,
            );
            this.setStart(document.body, 0);
            this.collapse(true);
            return this;
          }
        } else {
          throw error;
        }
      }
    };

    // Mark as patched to avoid double patching
    (Range.prototype.setEnd as any).__patched = true;
  }

  const originalSetStart = Range.prototype.setStart;
  // Use a TypeScript workaround to add a custom property to a native method
  const setStartPatched = (originalSetStart as any).__patched;
  if (!setStartPatched) {
    Range.prototype.setStart = function (node, offset) {
      try {
        return originalSetStart.call(this, node, offset);
      } catch (error: any) {
        if (error.name === "IndexSizeError") {
          // Get a truly safe offset for this node
          let safeOffset = 0;

          try {
            // First check if it's a text node
            if (node.nodeType === Node.TEXT_NODE && node.textContent) {
              // For text nodes, we can safely use 0
              safeOffset = 0;
            }
            // If it's an element node
            else if (node.nodeType === Node.ELEMENT_NODE) {
              // For element nodes, use 0 as it's always safe
              safeOffset = 0;
            }

            console.warn(
              `Range.setStart IndexSizeError prevented. Offset ${offset} adjusted to ${safeOffset}`,
            );

            return originalSetStart.call(this, node, safeOffset);
          } catch (nestedError) {
            // If we still can't set the range, use a safer approach:
            // Create a new range at the start of the document
            console.warn(
              "Failed to apply safe offset, using fallback",
              nestedError,
            );
            this.setStart(document.body, 0);
            this.collapse(true);
            return this;
          }
        } else {
          throw error;
        }
      }
    };

    // Mark as patched to avoid double patching
    (Range.prototype.setStart as any).__patched = true;
  }
};

export const SafeHighlightPopover = (props: HighlightPopoverProps) => {
  useEffect(() => {
    patchRangePrototype();
  }, []);

  // Render the original HighlightPopover with all props
  return <HighlightPopover className="w-full" {...props} />;
};
