"use client";

import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/animations";

interface TechPillProps {
  name: string;
  icon?: React.ReactNode;
  index?: number;
}

export default function TechPill({ name, icon, index = 0 }: TechPillProps) {
  return (
    <motion.div
      variants={fadeInUp}
      custom={index}
      initial={false}
      whileInView="visible"
      viewport={{ once: true }}
      className="glass flex items-center gap-2 rounded-lg px-3 py-2 text-sm
        transition-all duration-300
        hover:-translate-y-1 hover:border-[var(--accent)]/30
        hover:shadow-md hover:shadow-[var(--accent-glow)]"
      data-cursor="pointer"
    >
      {icon && <span className="text-[var(--accent)]">{icon}</span>}
      <span className="font-mono text-[var(--text-primary)]">{name}</span>
    </motion.div>
  );
}
