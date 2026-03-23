"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import type { AboutData } from "@/lib/types";
import AnimatedText from "@/components/ui/AnimatedText";
import TechPill from "@/components/ui/TechPill";
import TextReveal from "@/components/ui/TextReveal";
import ParallaxFloat from "@/components/ui/ParallaxFloat";

function CountUp({ target, duration = 2, suffix = "" }: { target: number; duration?: number; suffix?: string }) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(spanRef, { once: true });
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isInView || !spanRef.current) return;
    const el = spanRef.current;
    const startTime = performance.now();
    const durationMs = duration * 1000;
    let rafId: number;

    function tick(now: number) {
      const progress = Math.min((now - startTime) / durationMs, 1);
      const value = Math.floor(progress * target);
      el.textContent = `${value.toLocaleString()}${suffix}`;
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        el.textContent = `${target.toLocaleString()}${suffix}`;
        setDone(true);
      }
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isInView, target, duration, suffix]);

  return (
    <motion.span
      ref={spanRef}
      className="inline-block"
      animate={done ? { scale: [1, 1.2, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      0{suffix}
    </motion.span>
  );
}

export default function About({ data }: { data: AboutData }) {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const bgY2 = useTransform(scrollYProgress, [0, 1], [-50, 50]);

  return (
    <section id="about" className="relative py-20 md:py-32 overflow-hidden" ref={sectionRef}>
      {/* Parallax background orbs */}
      <motion.div
        className="absolute -right-32 top-20 h-64 w-64 rounded-full bg-[var(--accent)] opacity-5 blur-[100px]"
        style={{ y: bgY }}
      />
      <motion.div
        className="absolute -left-32 bottom-20 h-48 w-48 rounded-full bg-[var(--accent-2)] opacity-5 blur-[80px]"
        style={{ y: bgY2 }}
      />

      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid gap-12 md:gap-16 md:grid-cols-2"
        >
          {/* Bio side */}
          <div>
            <motion.span variants={fadeInUp} custom={0} className="section-label mb-2 block">
              About
            </motion.span>
            <TextReveal className="mb-6 md:mb-8 font-mono text-3xl font-bold text-[var(--text-primary)] sm:text-4xl md:text-5xl">
              Who I Am
            </TextReveal>

            <div className="mb-8 space-y-4 text-lg leading-relaxed text-[var(--text-muted)]">
              {data.bio.map((paragraph, i) => (
                <AnimatedText
                  key={paragraph}
                  text={paragraph}
                  type="words"
                  as="p"
                  delay={i * 10}
                />
              ))}
            </div>

            {/* Stats with count-up and pulse on completion */}
            <motion.div variants={fadeInUp} custom={4} className="flex flex-wrap gap-6 sm:gap-8">
              {data.stats.map((stat) => (
                <motion.div
                  key={stat.label}
                  className="group text-center"
                  whileHover={{ scale: 1.05, y: -4 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="font-mono text-3xl font-bold text-[var(--accent)] transition-all duration-300 group-hover:text-shadow-glow">
                    <CountUp target={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="mt-1 text-sm text-[var(--text-muted)]">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Tech Stack side */}
          <div>
            {Object.entries(data.techStack).map(([category, skills], catIdx) => (
              <ParallaxFloat key={category} speed={15 + catIdx * 5} className="mb-8">
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: catIdx * 0.15, duration: 0.5 }}
                >
                  <h3 className="section-label mb-3">{category}</h3>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, i) => (
                      <TechPill key={skill} name={skill} index={i + catIdx * 7} />
                    ))}
                  </div>
                </motion.div>
              </ParallaxFloat>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
