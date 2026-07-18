export function createDragGuard(thresholdPx = 5) {
  let anchor = { x: 0, y: 0 };
  return {
    onPointerDown: (e: { clientX: number; clientY: number }) => {
      anchor = { x: e.clientX, y: e.clientY };
    },
    wasDrag: (e: { clientX: number; clientY: number }) =>
      Math.hypot(e.clientX - anchor.x, e.clientY - anchor.y) > thresholdPx,
  };
}
