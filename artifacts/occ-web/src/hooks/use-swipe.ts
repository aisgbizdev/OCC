import { useEffect, useRef } from "react";

interface SwipeHandlers {
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
}

interface SwipeOptions {
  threshold?: number;
  edgeThreshold?: number;
  disabled?: boolean;
}

export function useSwipe<T extends HTMLElement>(
  element: React.RefObject<T | null>,
  { onSwipeRight, onSwipeLeft }: SwipeHandlers,
  { threshold = 60, edgeThreshold = 40, disabled = false }: SwipeOptions = {}
) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const startedFromEdge = useRef(false);

  useEffect(() => {
    if (disabled) return;
    const el = element.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      startX.current = touch.clientX;
      startY.current = touch.clientY;
      startedFromEdge.current = touch.clientX <= edgeThreshold;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (startX.current === null || startY.current === null) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - startX.current;
      const dy = touch.clientY - startY.current;

      if (Math.abs(dy) > Math.abs(dx) * 1.5) {
        startX.current = null;
        startY.current = null;
        return;
      }

      if (dx > threshold && startedFromEdge.current && onSwipeRight) {
        onSwipeRight();
      } else if (dx < -threshold && onSwipeLeft) {
        onSwipeLeft();
      }

      startX.current = null;
      startY.current = null;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [element, onSwipeRight, onSwipeLeft, threshold, edgeThreshold, disabled]);
}
