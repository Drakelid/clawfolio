"use client";

import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import type { ContactData, HeroData } from "@/lib/types";
import MagneticButton from "@/components/ui/MagneticButton";
import TextReveal from "@/components/ui/TextReveal";

export default function Contact({
  data,
  socials,
}: {
  data: ContactData;
  socials: HeroData["socials"];
}) {
  const [formState, setFormState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [focused, setFocused] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const email = data.email;

  // Pre-compute confetti positions so they're stable across renders
  const confettiPositions = useMemo(
    () => Array.from({ length: 12 }, (_, index) => {
      const angle = (index / 12) * Math.PI * 2;
      return {
        x: Math.cos(angle) * 150,
        y: Math.sin(angle) * 150,
      };
    }),
    []
  );

  const validate = (form: FormData) => {
    const errs: Record<string, boolean> = {};
    if (!form.get("name")) errs.name = true;
    if (!form.get("email") || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.get("email") as string))
      errs.email = true;
    if (!form.get("message")) errs.message = true;
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = new FormData(formRef.current!);
    const errs = validate(form);
    setErrors(errs);

    if (Object.keys(errs).length > 0) return;

    setFormState("loading");

    try {
      const name = form.get("name") as string;
      const senderEmail = form.get("email") as string;
      const message = form.get("message") as string;

      const subject = encodeURIComponent(`Portfolio contact from ${name}`);
      const body = encodeURIComponent(`From: ${name} <${senderEmail}>\n\n${message}`);
      window.open(`mailto:${email}?subject=${subject}&body=${body}`);

      setFormState("success");
    } catch {
      setFormState("error");
    }
  };

  const copyEmail = async () => {
    await navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="contact" className="relative py-20 md:py-32 overflow-hidden">
      {/* Background decoration */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-[var(--accent)] opacity-[0.03] blur-[150px]"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity }}
      />

      <div className="mx-auto max-w-2xl px-6">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center"
        >
          <motion.span variants={fadeInUp} custom={0} className="section-label mb-2 block">
            Contact
          </motion.span>
          <TextReveal className="mb-4 font-mono text-3xl font-bold text-[var(--text-primary)] sm:text-4xl md:text-5xl">
            Let&apos;s Build Something
          </TextReveal>
          <motion.p
            variants={fadeInUp}
            custom={2}
            className="mb-12 text-lg text-[var(--text-muted)]"
          >
            Have a project in mind or just want to chat? I&apos;d love to hear from you.
          </motion.p>
        </motion.div>

        <AnimatePresence mode="wait">
          {formState === "success" ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 py-16"
            >
              {/* Animated SVG checkmark */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20"
              >
                <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none">
                  <motion.path
                    d="M5 13l4 4L19 7"
                    stroke="#10B981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                  />
                </svg>
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="font-mono text-xl font-bold text-[var(--text-primary)]"
              >
                Message Sent!
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-[var(--text-muted)]"
              >
                Thanks for reaching out. I&apos;ll get back to you soon.
              </motion.p>
              {/* Confetti-like particles */}
              {confettiPositions.map((pos, i) => (
                <motion.div
                  key={i}
                  className="absolute h-2 w-2 rounded-full"
                  style={{
                    background: i % 2 === 0 ? "var(--accent)" : "var(--accent-2)",
                    left: "50%",
                    top: "40%",
                  }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x: pos.x,
                    y: pos.y,
                    opacity: 0,
                    scale: 0,
                  }}
                  transition={{ duration: 1, delay: 0.3 + i * 0.05, ease: "easeOut" }}
                />
              ))}
            </motion.div>
          ) : (
            <motion.form
              key="form"
              ref={formRef}
              onSubmit={handleSubmit}
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {[
                { name: "name", type: "text", label: "Name" },
                { name: "email", type: "email", label: "Email" },
              ].map((field, i) => (
                <motion.div
                  key={field.name}
                  className="relative"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <motion.div
                    className="absolute inset-0 rounded-lg opacity-0"
                    animate={{
                      opacity: focused === field.name ? 1 : 0,
                      boxShadow: focused === field.name
                        ? "0 0 0 3px var(--accent-glow), 0 0 20px var(--accent-glow)"
                        : "none",
                    }}
                    transition={{ duration: 0.3 }}
                  />
                  <input
                    type={field.type}
                    name={field.name}
                    id={field.name}
                    placeholder=" "
                    onFocus={() => setFocused(field.name)}
                    onBlur={() => setFocused(null)}
                    className={`peer relative z-10 w-full rounded-lg border bg-transparent px-4 pb-3 pt-6 font-mono text-sm text-[var(--text-primary)] outline-none transition-all duration-300 placeholder-transparent ${
                      errors[field.name]
                        ? "animate-[shake_0.5s_ease-in-out] border-red-500"
                        : "border-[var(--border)] focus:border-[var(--accent)]"
                    }`}
                  />
                  <label
                    htmlFor={field.name}
                    className="absolute left-4 top-2 z-10 text-xs text-[var(--text-muted)] transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-[var(--accent)]"
                  >
                    {field.label}
                  </label>
                  {/* Validation indicator */}
                  {errors[field.name] && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 z-10"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </motion.span>
                  )}
                </motion.div>
              ))}

              {/* Message textarea */}
              <motion.div
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <motion.div
                  className="absolute inset-0 rounded-lg opacity-0"
                  animate={{
                    opacity: focused === "message" ? 1 : 0,
                    boxShadow: focused === "message"
                      ? "0 0 0 3px var(--accent-glow), 0 0 20px var(--accent-glow)"
                      : "none",
                  }}
                  transition={{ duration: 0.3 }}
                />
                <textarea
                  name="message"
                  id="message"
                  rows={5}
                  placeholder=" "
                  onFocus={() => setFocused("message")}
                  onBlur={() => setFocused(null)}
                  className={`peer relative z-10 w-full resize-none rounded-lg border bg-transparent px-4 pb-3 pt-6 font-mono text-sm text-[var(--text-primary)] outline-none transition-all duration-300 placeholder-transparent ${
                    errors.message
                      ? "animate-[shake_0.5s_ease-in-out] border-red-500"
                      : "border-[var(--border)] focus:border-[var(--accent)]"
                  }`}
                />
                <label
                  htmlFor="message"
                  className="absolute left-4 top-2 z-10 text-xs text-[var(--text-muted)] transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-[var(--accent)]"
                >
                  Message
                </label>
              </motion.div>

              <MagneticButton
                as="button"
                type="submit"
                disabled={formState === "loading"}
                strength={0.2}
                className={`relative w-full overflow-hidden rounded-full bg-[var(--accent)] px-8 py-4 font-mono text-base font-medium text-white transition-all sm:w-auto ${
                  formState === "loading" ? "opacity-80 cursor-not-allowed" : "glow-pulse hover:brightness-110"
                }`}
              >
                {formState === "loading" ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.span
                      className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    />
                    Sending...
                  </span>
                ) : (
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Send Message
                    <motion.svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      whileHover={{ x: 4 }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </motion.svg>
                  </span>
                )}
              </MagneticButton>

              {formState === "error" && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-red-400"
                >
                  Something went wrong. Please try again.
                </motion.p>
              )}
            </motion.form>
          )}
        </AnimatePresence>

        {/* Alternate contact */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-16 flex flex-col items-center gap-4 border-t border-[var(--border)] pt-8"
        >
          <p className="text-sm text-[var(--text-muted)]">Or reach out directly</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <motion.span
              className="font-mono text-sm sm:text-base text-[var(--text-primary)] break-all"
              whileHover={{ color: "var(--accent)" }}
            >
              {email}
            </motion.span>
            <motion.button
              onClick={copyEmail}
              data-cursor="pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative rounded-lg border border-[var(--border)] px-3 py-1.5 font-mono text-xs text-[var(--text-muted)] transition-all hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={copied ? "copied" : "copy"}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  {copied ? "Copied!" : "Copy"}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </div>
          <div className="mt-4 flex gap-4">
            {[
              { label: "GitHub", href: socials.github },
              { label: "LinkedIn", href: socials.linkedin },
              { label: "Twitter", href: socials.twitter },
            ].map(({ label: platform, href }, i) => (
              <MagneticButton
                key={platform}
                as="a"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                strength={0.4}
                className="text-sm font-mono text-[var(--text-muted)] transition-colors hover:text-[var(--accent)]"
              >
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                >
                  {platform}
                </motion.span>
              </MagneticButton>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
