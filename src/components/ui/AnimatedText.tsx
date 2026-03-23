"use client";

import { motion } from "framer-motion";
import { charAnimation, wordBlurIn } from "@/lib/animations";

interface AnimatedTextProps {
  text: string;
  type?: "chars" | "words";
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  delay?: number;
}

export default function AnimatedText({
  text,
  type = "chars",
  className = "",
  as: Tag = "p",
  delay = 0,
}: AnimatedTextProps) {
  const items = type === "chars" ? text.split("") : text.split(" ");
  const variants = type === "chars" ? charAnimation : wordBlurIn;

  return (
    <Tag className={className}>
      <motion.span
        initial={false}
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="inline"
      >
        {items.map((item, i) => (
          <motion.span
            key={`${item}-${i}`}
            custom={i + delay}
            variants={variants}
            className="inline-block"
            style={{ whiteSpace: type === "words" ? "pre" : undefined }}
          >
            {type === "words" ? (i < items.length - 1 ? item + "\u00A0" : item) : item}
          </motion.span>
        ))}
      </motion.span>
    </Tag>
  );
}
