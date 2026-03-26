"use client";

import { useEffect, useRef } from "react";

export default function MouseSpotlight() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;

    if (window.matchMedia("(pointer: coarse)").matches) return;

    let frame = 0;
    let nextX = -1000;
    let nextY = -1000;

    const paint = () => {
      frame = 0;
      glow.style.opacity = "1";
      glow.style.transform = `translate3d(${nextX}px, ${nextY}px, 0) translate(-50%, -50%)`;
    };

    const handlePointerMove = (event: PointerEvent) => {
      nextX = event.clientX;
      nextY = event.clientY;

      if (!frame) {
        frame = requestAnimationFrame(paint);
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      if (frame) {
        cancelAnimationFrame(frame);
      }
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden" aria-hidden="true">
      <div
        ref={glowRef}
        className="absolute left-0 top-0 h-[38rem] w-[38rem] rounded-full opacity-0 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(59, 130, 246, 0.14) 0%, rgba(59, 130, 246, 0.08) 30%, transparent 68%)",
          transform: "translate3d(-1000px, -1000px, 0) translate(-50%, -50%)",
          willChange: "transform, opacity",
        }}
      />
    </div>
  );
}
