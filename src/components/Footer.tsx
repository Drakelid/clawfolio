"use client";

import { motion } from "framer-motion";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import MagneticButton from "@/components/ui/MagneticButton";

const navLinks = [
  { label: "About", href: "#about" },
  { label: "Projects", href: "#projects" },
  { label: "Experience", href: "#experience" },
  { label: "Contact", href: "#contact" },
];

const socialLinks = [
  { label: "GitHub", href: "https://github.com" },
  { label: "LinkedIn", href: "https://linkedin.com" },
  { label: "Twitter", href: "https://twitter.com" },
];

const CURRENT_YEAR = String(new Date().getFullYear());

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative overflow-hidden border-t border-[var(--border)]">
      <motion.div
        className="absolute left-0 right-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--accent), var(--accent-2), var(--accent), transparent)",
        }}
        animate={{ backgroundPosition: ["0% 0%", "100% 0%"] }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
      />

      <motion.div
        className="mx-auto max-w-6xl px-6 py-10 md:py-12"
        variants={staggerContainer}
        initial={false}
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="grid gap-8 text-center md:grid-cols-3 md:text-left">
          <motion.div variants={fadeInUp} custom={0}>
            <motion.span
              className="inline-block font-mono text-lg font-bold text-[var(--accent)]"
              whileHover={{ scale: 1.05 }}
            >
              Fredrik Drakelid
            </motion.span>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Full Stack Developer crafting digital experiences.
            </p>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            custom={1}
            className="flex flex-wrap justify-center gap-4 sm:gap-6"
          >
            {navLinks.map(({ label, href }) => (
              <MagneticButton
                key={href}
                as="a"
                href={href}
                strength={0.3}
                className="group relative font-mono text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
              >
                <span>{label}</span>
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-[var(--accent)] transition-all duration-300 group-hover:w-full" />
              </MagneticButton>
            ))}
          </motion.div>

          <motion.div
            variants={fadeInUp}
            custom={2}
            className="flex justify-center gap-4 md:justify-end"
          >
            {socialLinks.map(({ label, href }) => (
              <MagneticButton
                key={label}
                as="a"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                strength={0.4}
                className="group relative font-mono text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--accent)]"
              >
                <span>{label}</span>
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-[var(--accent)] transition-all duration-300 group-hover:w-full" />
              </MagneticButton>
            ))}
          </motion.div>
        </div>

        <motion.div
          variants={fadeInUp}
          custom={3}
          className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-[var(--border)] pt-8 md:flex-row"
        >
          <motion.p
            className="text-sm text-[var(--text-muted)]"
            whileHover={{ color: "var(--text-primary)" }}
          >
            Designed & built with care | {CURRENT_YEAR}
          </motion.p>
          <MagneticButton
            as="button"
            strength={0.3}
            className="group flex items-center gap-2 font-mono text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--accent)]"
            onClick={scrollToTop}
          >
            Back to top
            <motion.svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              className="transition-transform group-hover:-translate-y-1"
            >
              <path
                d="M7 12V2M2 7l5-5 5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.svg>
          </MagneticButton>
        </motion.div>
      </motion.div>
    </footer>
  );
}
