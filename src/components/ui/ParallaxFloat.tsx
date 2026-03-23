"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useMediaQuery } from "@/lib/client-hooks";

interface ParallaxFloatProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
  direction?: "up" | "down";
}

export default function ParallaxFloat({
  children,
  speed = 50,
  className = "",
  direction = "up",
}: ParallaxFloatProps) {
  const ref = useRef(null);
  const isTouch = useMediaQuery("(pointer: coarse)");

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    direction === "up" ? [speed, -speed] : [-speed, speed]
  );

  return (
    <motion.div
      ref={ref}
      style={{ y: isTouch ? 0 : y }}
      className={["relative", className].filter(Boolean).join(" ")}
    >
      {children}
    </motion.div>
  );
}
