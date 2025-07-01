import { useRef, useState, useEffect, useCallback } from "react";
import { useCaptureStore } from "./use-capture-store";

export const useCapture = ({
  onScreenshot,
}: {
  onScreenshot: (images: string[]) => void;
}) => {
  const screenshotRef = useRef<HTMLDivElement | null>(null);
  const { isCapturing, setIsCapturing, setLoading, isDragging, setIsDragging } =
    useCaptureStore();
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [endPoint, setEndPoint] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!isCapturing) {
      setIsDragging(false);
      setStartPoint({ x: 0, y: 0 });
      setEndPoint({ x: 0, y: 0 });
    }
  }, [isCapturing]);

  const getRelativeCoordinates = useCallback(
    (clientX: number, clientY: number, target: HTMLElement) => {
      const rect = target.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    },
    [],
  );

  const handleStart = useCallback(
    (clientX: number, clientY: number, target: HTMLElement) => {
      if (isCapturing) {
        setIsDragging(true);
        const coords = getRelativeCoordinates(clientX, clientY, target);
        setStartPoint(coords);
        setEndPoint(coords);
      }
    },
    [isCapturing, getRelativeCoordinates],
  );

  const handleMove = useCallback(
    (clientX: number, clientY: number, target: HTMLElement) => {
      if (isDragging) {
        const coords = getRelativeCoordinates(clientX, clientY, target);
        setEndPoint(coords);
      }
    },
    [isDragging, getRelativeCoordinates],
  );

  const handleEnd = useCallback(async () => {
    if (!isDragging || !screenshotRef.current) return;

    setIsDragging(false);

    const overlayElement = screenshotRef.current.querySelector(
      '[class*="bg-black"]',
    );
    if (!overlayElement) return;

    const overlayRect = overlayElement.getBoundingClientRect();
    const containerRect = screenshotRef.current.getBoundingClientRect();
    const offsetY = overlayRect.top - containerRect.top;

    const relativeStartX = Math.min(startPoint.x, endPoint.x);
    const relativeStartY = Math.min(startPoint.y, endPoint.y) + offsetY;
    const width = Math.abs(endPoint.x - startPoint.x);
    const height = Math.abs(endPoint.y - startPoint.y);

    if (width < 10 || height < 10) {
      setIsCapturing(false);
      return;
    }

    try {
      setLoading(true);
      const html2canvas = (await import("html2canvas")).default;

      const canvas = await html2canvas(screenshotRef.current, {
        x: relativeStartX,
        y: relativeStartY,
        width,
        height,
        scale: window.devicePixelRatio,
        useCORS: true,
        backgroundColor: null,
        ignoreElements: (element) =>
          element.classList.contains("bg-black/50") ||
          element.classList.contains("absolute"),
      });

      const croppedImage = canvas.toDataURL("image/png", 0.5);
      onScreenshot([croppedImage]);
    } catch (error) {
      console.error("Failed to capture screenshot:", error);
    } finally {
      setLoading(false);
      setIsCapturing(false);
    }
  }, [
    isDragging,
    startPoint,
    endPoint,
    setIsCapturing,
    setLoading,
    onScreenshot,
  ]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      handleStart(e.clientX, e.clientY, e.currentTarget);
    },
    [handleStart],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      handleMove(e.clientX, e.clientY, e.currentTarget);
    },
    [handleMove],
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY, e.currentTarget);
    },
    [handleStart],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY, e.currentTarget);
    },
    [handleMove],
  );

  return {
    screenshotRef,
    isCapturing,
    isDragging,
    startPoint,
    endPoint,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp: handleEnd,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd: handleEnd,
  };
};
