"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useMediaQuery } from "@/lib/client-hooks";

export default function CustomCursor() {
  const [isHovering, setIsHovering] = useState(false);
  const [cursorLabel, setCursorLabel] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const isVisibleRef = useRef(false);
  const isCoarsePointer = useMediaQuery("(pointer: coarse)");

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springX = useSpring(cursorX, { damping: 34, stiffness: 680, mass: 0.18 });
  const springY = useSpring(cursorY, { damping: 34, stiffness: 680, mass: 0.18 });

  useEffect(() => {
    if (isCoarsePointer) {
      return;
    }

    const moveCursor = (e: PointerEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
        setIsVisible(true);
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const cursorAttr = target.closest("[data-cursor]");
      if (cursorAttr) {
        setIsHovering(true);
        const label = cursorAttr.getAttribute("data-cursor-label") || "";
        setCursorLabel(label);
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-cursor]")) {
        setIsHovering(false);
        setCursorLabel("");
      }
    };

    window.addEventListener("pointermove", moveCursor, { passive: true });
    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);

    return () => {
      window.removeEventListener("pointermove", moveCursor);
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
    };
  }, [cursorX, cursorY, isCoarsePointer]);

  if (isCoarsePointer) return null;

  return (
    <>
      {/* Small dot */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[10000] rounded-full bg-[var(--accent)]"
        style={{
          x: cursorX,
          y: cursorY,
          width: isHovering ? 0 : 6,
          height: isHovering ? 0 : 6,
          translateX: "-50%",
          translateY: "-50%",
          opacity: isVisible ? 1 : 0,
          willChange: "transform, width, height, opacity",
        }}
        transition={{ width: { duration: 0.15 }, height: { duration: 0.15 } }}
      />
      {/* Larger ring */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[10000] flex items-center justify-center rounded-full border-2 border-[var(--accent)]"
        style={{
          x: springX,
          y: springY,
          translateX: "-50%",
          translateY: "-50%",
          opacity: isVisible ? 1 : 0,
          willChange: "transform, width, height, opacity",
        }}
        animate={{
          width: isHovering ? 48 : 32,
          height: isHovering ? 48 : 32,
          backgroundColor: isHovering
            ? "rgba(59, 130, 246, 0.1)"
            : "rgba(59, 130, 246, 0)",
          borderColor: isHovering ? "var(--accent)" : "rgba(59, 130, 246, 0.5)",
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {cursorLabel && (
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="text-[10px] font-mono text-[var(--accent)]"
          >
            {cursorLabel}
          </motion.span>
        )}
      </motion.div>
    </>
  );
}
