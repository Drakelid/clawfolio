"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { slideInLeft, slideInRight } from "@/lib/animations";
import type { Experience as ExperienceEntryData } from "@/lib/types";
import TextReveal from "@/components/ui/TextReveal";

export default function Experience({ experience }: { experience: ExperienceEntryData[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 80%", "end 20%"],
  });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section id="experience" className="relative py-20 md:py-32 overflow-hidden">
      {/* Floating background elements */}
      <motion.div
        className="absolute right-10 top-40 h-2 w-2 rounded-full bg-[var(--accent)]"
        animate={{ y: [0, -20, 0], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.div
        className="absolute left-20 bottom-60 h-3 w-3 rounded-full bg-[var(--accent-2)]"
        animate={{ y: [0, 15, 0], opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 5, repeat: Infinity, delay: 1 }}
      />

      <div className="mx-auto max-w-6xl px-6">
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="section-label mb-2 block"
        >
          Experience
        </motion.span>
        <TextReveal className="mb-10 md:mb-16 font-mono text-3xl font-bold text-[var(--text-primary)] sm:text-4xl md:text-5xl">
          Where I&apos;ve Worked
        </TextReveal>

        <div ref={containerRef} className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[var(--border)] md:left-1/2 md:-translate-x-1/2">
            <motion.div
              className="w-full origin-top rounded-full"
              style={{
                height: lineHeight,
                background: "linear-gradient(to bottom, var(--accent), var(--accent-2), var(--accent))",
              }}
            />
          </div>

          {/* Timeline entries */}
          {experience.map((entry, i) => {
            const isLeft = i % 2 === 0;

            return <ExperienceEntry key={entry.id} entry={entry} isLeft={isLeft} />;
          })}
        </div>
      </div>
    </section>
  );
}

interface EntryProps {
  entry: ExperienceEntryData;
  isLeft: boolean;
}

function ExperienceEntry({ entry, isLeft }: EntryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="relative mb-12 flex items-start md:mb-16">
      {/* Center dot */}
      <motion.div
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
        className="absolute left-4 z-10 -translate-x-1/2 md:left-1/2"
      >
        <motion.div
          className="relative h-4 w-4 rounded-full border-2 border-[var(--accent)] bg-[var(--bg-primary)]"
          whileHover={{ scale: 1.5 }}
        >
          <div className="absolute inset-0 animate-ping rounded-full bg-[var(--accent)] opacity-20" />
          {/* Connector line pulse — desktop only */}
          <motion.div
            className="absolute top-1/2 h-px bg-gradient-to-r from-[var(--accent)] to-transparent hidden md:block"
            style={{
              width: "2rem",
              left: isLeft ? "100%" : "auto",
              right: isLeft ? "auto" : "100%",
              transform: isLeft ? undefined : "rotate(180deg)",
            }}
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.5 }}
          />
        </motion.div>
      </motion.div>

      {/* Card */}
      <motion.div
        variants={isLeft ? slideInLeft : slideInRight}
        initial={false}
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className={`ml-10 w-full md:ml-0 md:w-[calc(50%-2rem)] ${
          isLeft ? "md:mr-auto md:pr-8" : "md:ml-auto md:pl-8"
        }`}
      >
        <motion.div
          className="glass relative rounded-xl p-6 cursor-pointer group"
          onClick={() => setIsExpanded(!isExpanded)}
          whileHover={{ scale: 1.02, borderColor: "rgba(59, 130, 246, 0.2)" }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          data-cursor="pointer"
        >
          {/* Hover glow */}
          <div className="absolute -inset-px rounded-xl bg-gradient-to-r from-[var(--accent)]/0 via-[var(--accent)]/5 to-[var(--accent-2)]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl" />

          <div className="mb-1 flex items-center justify-between">
            <span className="font-mono text-xs text-[var(--accent)]">
              {entry.period}
            </span>
            <motion.svg
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="h-4 w-4 text-[var(--text-muted)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </motion.svg>
          </div>
          <h3 className="mb-1 font-mono text-xl font-bold text-[var(--text-primary)]">
            {entry.role}
          </h3>
          <div className="mb-4 text-[var(--text-muted)]">
            {entry.companyUrl ? (
              <motion.a
                href={entry.companyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-[var(--accent)] inline-flex items-center gap-1"
                data-cursor="pointer"
                whileHover={{ x: 4 }}
                onClick={(e) => e.stopPropagation()}
              >
                {entry.company}
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </motion.a>
            ) : (
              entry.company
            )}
          </div>

          {/* Expandable bullet points */}
          <motion.ul
            initial={false}
            animate={{
              height: isExpanded ? "auto" : 0,
              opacity: isExpanded ? 1 : 0,
            }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-2 overflow-hidden"
          >
            {entry.description.map((desc, j) => (
              <motion.li
                key={j}
                initial={{ opacity: 0, x: -10 }}
                animate={isExpanded ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                transition={{ delay: isExpanded ? j * 0.1 : 0, duration: 0.3 }}
                className="flex gap-2 text-sm text-[var(--text-muted)] leading-relaxed"
              >
                <motion.span
                  className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--accent)]"
                  animate={isExpanded ? { scale: [0, 1.3, 1] } : { scale: 0 }}
                  transition={{ delay: isExpanded ? j * 0.1 + 0.1 : 0 }}
                />
                {desc}
              </motion.li>
            ))}
          </motion.ul>

          {!isExpanded && (
            <p className="text-xs text-[var(--text-muted)]/60 font-mono mt-2">
              Click to expand
            </p>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
