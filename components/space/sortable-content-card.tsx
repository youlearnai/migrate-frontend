import { SortableContentCardProps } from "@/lib/types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ContentCard from "../global/content-card";

export const SortableContentCard = ({
  content,
  priority,
  spaceId,
  dropdownItems,
  className,
}: SortableContentCardProps) => {
  const router = useRouter();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isTouching, setIsTouching] = useState(false);
  const touchTimeout = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const hasMoved = useRef(false);
  const isNavigating = useRef(false);
  const dragStartTime = useRef<number | null>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: content.content_id,
    disabled: isEditingTitle,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (isDragging || isEditingTitle) return;

    // Only handle mouse clicks, not touch events
    if ((e.nativeEvent as PointerEvent).pointerType !== "touch") {
      const dragDuration = dragStartTime.current
        ? Date.now() - dragStartTime.current
        : 0;

      // If the mouse was held down for less than 250ms, consider it a click
      if (dragDuration < 250) {
        e.preventDefault();
        e.stopPropagation();
        if (!isNavigating.current) {
          e.nativeEvent.stopImmediatePropagation();
          isNavigating.current = true;
          router.push(`/learn/space/${spaceId}/content/${content.content_id}`);
        }
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isEditingTitle) return;

    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    hasMoved.current = false;
    isNavigating.current = false;

    touchTimeout.current = setTimeout(() => {
      if (!hasMoved.current) {
        setIsTouching(true);
      }
    }, 150);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos.current || isEditingTitle) return;

    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);

    if (deltaX > 10 || deltaY > 10) {
      hasMoved.current = true;
      if (touchTimeout.current) {
        clearTimeout(touchTimeout.current);
        touchTimeout.current = null;
      }
      setIsTouching(false);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchTimeout.current) {
      clearTimeout(touchTimeout.current);
      touchTimeout.current = null;
    }

    if (
      !hasMoved.current &&
      !isDragging &&
      !isEditingTitle &&
      !isNavigating.current
    ) {
      isNavigating.current = true;
      router.push(`/learn/space/${spaceId}/content/${content.content_id}`);
    }

    touchStartPos.current = null;
    setIsTouching(false);
  };

  const cleanupTouch = () => {
    if (touchTimeout.current) {
      clearTimeout(touchTimeout.current);
      touchTimeout.current = null;
    }
    touchStartPos.current = null;
    hasMoved.current = false;
    setIsTouching(false);
  };

  // Track when drag starts
  const handleDragStart = () => {
    dragStartTime.current = Date.now();
  };

  // Reset drag tracking when drag ends
  const handleDragEnd = () => {
    dragStartTime.current = null;
  };

  useEffect(() => {
    return cleanupTouch;
  }, []);

  useEffect(() => {
    if (isNavigating.current) {
      const timeout = setTimeout(() => {
        isNavigating.current = false;
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [isNavigating.current]);

  const modifiedListeners = {
    ...listeners,
    onPointerDown: (e: React.PointerEvent) => {
      if (!isDragging && !isEditingTitle) {
        handleDragStart();
        listeners?.onPointerDown?.(e);
      }
    },
    onPointerUp: (e: React.PointerEvent) => {
      if (!isDragging && !isEditingTitle) {
        handleDragEnd();
        listeners?.onPointerUp?.(e);
      }
    },
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isEditingTitle ? {} : { ...attributes, ...modifiedListeners })}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={cleanupTouch}
      className={`relative group will-change-transform transition-opacity duration-200 ${
        isDragging ? "opacity-40" : ""
      } ${isTouching ? "opacity-70" : ""}`}
    >
      <ContentCard
        priority={priority}
        spaceId={spaceId}
        dropdownItems={dropdownItems}
        className={className}
        onTitleEditStart={() => setIsEditingTitle(true)}
        onTitleEditEnd={() => setIsEditingTitle(false)}
        {...content}
      />
    </div>
  );
};
