import { CaptureOverlayProps } from "@/lib/types";
import { memo } from "react";

const CaptureOverlay = memo(
  ({
    isDragging,
    startPoint,
    endPoint,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  }: CaptureOverlayProps) => (
    <div
      className="absolute inset-0 bg-black/50 cursor-crosshair z-50"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {isDragging && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: Math.min(startPoint.x, endPoint.x),
            top: Math.min(startPoint.y, endPoint.y),
            width: Math.abs(endPoint.x - startPoint.x),
            height: Math.abs(endPoint.y - startPoint.y),
            border: "2px solid white",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
          }}
        />
      )}
    </div>
  ),
);

CaptureOverlay.displayName = "CaptureOverlay";

export default CaptureOverlay;
