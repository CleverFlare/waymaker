import { useCallback, useRef } from "react";

export function useDragGuard(thresholdPx = 5) {
  const pointerDownPos = useRef({ x: 0, y: 0 });

  const onPointerDown = useCallback(
    (e: { clientX: number; clientY: number }) => {
      pointerDownPos.current = { x: e.clientX, y: e.clientY };
    },
    [],
  );

  const wasDrag = useCallback(
    (e: { clientX: number; clientY: number }) => {
      const dx = e.clientX - pointerDownPos.current.x;
      const dy = e.clientY - pointerDownPos.current.y;
      return Math.hypot(dx, dy) > thresholdPx;
    },
    [thresholdPx],
  );

  return { onPointerDown, wasDrag };
}
