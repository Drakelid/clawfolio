"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface TextRevealProps {
  children: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  delay?: number;
}

export default function TextReveal({
  children,
  className = "",
  as: Tag = "h2",
  delay = 0,
}: TextRevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <Tag ref={ref} className={className}>
      <span className="inline-block overflow-hidden">
        <motion.span
          className="inline-block"
          initial={{ y: "100%", rotateX: 30 }}
          animate={isInView ? { y: "0%", rotateX: 0 } : { y: "100%", rotateX: 30 }}
          transition={{
            duration: 0.7,
            delay,
            ease: [0.16, 1, 0.3, 1],
          }}
          style={{ transformOrigin: "bottom" }}
        >
          {children}
        </motion.span>
      </span>
    </Tag>
  );
}
