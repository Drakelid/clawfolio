"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import dynamic from "next/dynamic";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import type { HeroData } from "@/lib/types";
import MagneticButton from "@/components/ui/MagneticButton";

const HeroParticles = dynamic(() => import("@/components/HeroParticles"), {
  ssr: false,
});
const HeroScene = dynamic(() => import("@/components/HeroScene"), {
  ssr: false,
});


// â”€â”€ Code typing background â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const codeLines = [
  { text: 'import { NextRequest } from "next/server";', color: "var(--accent)" },
  { text: "", color: "" },
  { text: "export async function GET(req: NextRequest) {", color: "#c792ea" },
  { text: '  const db = await connect("production");', color: "#82aaff" },
  { text: "  const users = await db.query({", color: "#82aaff" },
  { text: '    table: "users",', color: "#c3e88d" },
  { text: "    limit: 50,", color: "#f78c6c" },
  { text: "    orderBy: { createdAt: 'desc' },", color: "#c3e88d" },
  { text: "  });", color: "#82aaff" },
  { text: "", color: "" },
  { text: "  return Response.json({", color: "#89ddff" },
  { text: "    data: users,", color: "#82aaff" },
  { text: "    count: users.length,", color: "#f78c6c" },
  { text: "  });", color: "#89ddff" },
  { text: "}", color: "#c792ea" },
  { text: "", color: "" },
  { text: "// Deploy to production", color: "#546e7a" },
  { text: "const config = defineConfig({", color: "#c792ea" },
  { text: '  runtime: "edge",', color: "#c3e88d" },
  { text: '  regions: ["iad1", "sfo1", "lhr1"],', color: "#c3e88d" },
  { text: "  env: process.env,", color: "#82aaff" },
  { text: "});", color: "#c792ea" },
];

function TypingCodeBackground() {
  const [visibleChars, setVisibleChars] = useState(0);
  const totalChars = codeLines.reduce((sum, l) => sum + l.text.length + 1, 0);

  useEffect(() => {
    let frame: number;
    let lastTime = 0;
    const charDelay = 35; // ms per character

    const tick = (time: number) => {
      if (time - lastTime > charDelay) {
        lastTime = time;
        setVisibleChars((prev) => {
          if (prev >= totalChars) return 0; // loop
          return prev + 1;
        });
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [totalChars]);

  // Build visible text from character count
  let charsLeft = visibleChars;
  const renderedLines: { text: string; color: string; full: boolean }[] = [];
  for (const line of codeLines) {
    if (charsLeft <= 0) break;
    const lineLen = line.text.length + 1; // +1 for newline
    if (charsLeft >= lineLen) {
      renderedLines.push({ text: line.text, color: line.color, full: true });
      charsLeft -= lineLen;
    } else {
      renderedLines.push({ text: line.text.slice(0, charsLeft), color: line.color, full: false });
      charsLeft = 0;
    }
  }

  return (
    <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none select-none flex items-center justify-center">
      <div
        className="font-mono text-[11px] sm:text-xs leading-[1.8] whitespace-pre max-w-[600px] w-full px-8"
        style={{
          opacity: 0.55,
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 45%, black 10%, transparent 65%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 45%, black 10%, transparent 65%)",
        }}
      >
        {renderedLines.map((line, i) => (
          <div key={i} style={{ color: line.color || "var(--text-secondary)" }}>
            {line.text}
            {!line.full && <span className="inline-block w-[1ch] h-[1.1em] bg-current animate-pulse align-middle" />}
          </div>
        ))}
      </div>
    </div>
  );
}

// â”€â”€ Grid lines that fade with distance from center â”€â”€â”€â”€â”€â”€â”€â”€â”€
function GridOverlay() {
  return (
    <div className="absolute inset-0 z-[0] overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(var(--accent) 1px, transparent 1px),
            linear-gradient(90deg, var(--accent) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse at center, black 0%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

// â”€â”€ Glowing orbs that respond to scroll â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ScrollOrbs() {
  const { scrollYProgress } = useScroll();
  const orb1X = useTransform(scrollYProgress, [0, 0.15], ["0%", "30%"]);
  const orb2X = useTransform(scrollYProgress, [0, 0.15], ["0%", "-25%"]);

  return (
    <>
      <motion.div
        className="absolute top-1/4 left-1/4 h-32 w-32 rounded-full"
        style={{
          x: orb1X,
          background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <motion.div
        className="absolute bottom-1/3 right-1/4 h-40 w-40 rounded-full"
        style={{
          x: orb2X,
          background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />
    </>
  );
}

// â”€â”€ Horizontal lines that scan across the viewport â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ScanLines() {
  return (
    <div className="absolute inset-0 z-[3] pointer-events-none overflow-hidden">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute left-0 right-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${
              i === 1 ? "var(--accent-2)" : "var(--accent)"
            }, transparent)`,
          }}
          initial={{ top: "-5%", opacity: 0 }}
          animate={{
            top: ["0%", "100%"],
            opacity: [0, 0.15, 0.15, 0],
          }}
          transition={{
            duration: 6 + i * 2,
            delay: i * 2.5,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

// â”€â”€ Main Hero â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function Hero({ data }: { data: HeroData }) {
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [isTouch, setIsTouch] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentYear, setCurrentYear] = useState("2026");

  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.92]);
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, 100]);

  // Mouse parallax for the content layer
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });
  const taglines = data.taglines.length > 0 ? data.taglines : [""];
  const socialLinks = [
    {
      label: "GitHub",
      href: data.socials.github,
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
      ),
    },
    {
      label: "LinkedIn",
      href: data.socials.linkedin,
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
    {
      label: "Twitter",
      href: data.socials.twitter,
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
  ];

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    const frame = requestAnimationFrame(() => {
      setMounted(true);
      setCurrentYear(String(new Date().getFullYear()));
      const touch = window.matchMedia("(pointer: coarse)").matches;
      setIsTouch(touch);
      setIsDesktop(window.innerWidth >= 768);
      if (touch) return;

      const handleMouse = (e: MouseEvent) => {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        mouseX.set((e.clientX - cx) / cx * 8);
        mouseY.set((e.clientY - cy) / cy * 5);
      };
      window.addEventListener("mousemove", handleMouse);
      cleanup = () => window.removeEventListener("mousemove", handleMouse);
    });

    return () => {
      cancelAnimationFrame(frame);
      cleanup?.();
    };
  }, [mouseX, mouseY]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineIndex((prev) => (prev + 1) % taglines.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [taglines.length]);

  const renderRoleLine = useCallback(() => {
    const text = data.role;
    return text.split("").map((char, i) => (
      <motion.span
        key={i}
        initial={false}
        animate={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
        transition={{
          delay: 1.0 + i * 0.035,
          duration: 0.6,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="inline-block"
      >
        {char === " " ? "\u00A0" : char}
      </motion.span>
    ));
  }, [data.role]);

  return (
    <motion.section
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
      style={{ scale: heroScale, y: heroY, opacity: heroOpacity }}
    >
      {/* â”€â”€ Layer 0: Grid overlay â”€â”€ */}
      <GridOverlay />

      {/* â”€â”€ Layer 1: Aurora background â”€â”€ */}
      <div className="aurora">
        <div className="aurora-blob" />
        <div className="aurora-blob" />
        <div className="aurora-blob" />
      </div>

      {/* â”€â”€ Layer 2: Scroll-reactive orbs â”€â”€ */}
      <ScrollOrbs />

      {/* â”€â”€ Layer 3: tsParticles â€” desktop only (heavy canvas) â”€â”€ */}
      {isDesktop && <HeroParticles />}

      {/* â”€â”€ Layer 4: 3D Scene â€” desktop only (WebGL) â”€â”€ */}
      {isDesktop && <HeroScene />}

      {/* â”€â”€ Layer 5: Scan lines â”€â”€ */}
      {mounted && <ScanLines />}

      {/* â”€â”€ Layer 6: Code typing background â”€â”€ */}
      {mounted && <TypingCodeBackground />}

      {/* â”€â”€ Layer 7: Intro flash overlay â€” client only, never in SSR HTML â”€â”€ */}
      {mounted && (
        <motion.div
          className="absolute inset-0 z-20 bg-[var(--bg-primary)] pointer-events-none"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        />
      )}

      {/* â”€â”€ Layer 8: Horizontal light streak on intro â”€â”€ */}
      {mounted && (
        <motion.div
          className="absolute inset-y-0 left-0 z-20 pointer-events-none"
          style={{
            width: "200px",
            background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.3), transparent)",
            filter: "blur(30px)",
          }}
          initial={{ x: "-200px" }}
          animate={{ x: "calc(100vw + 200px)" }}
          transition={{ duration: 1.5, delay: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
        />
      )}

      {/* â”€â”€ Content (parallax with mouse â€” desktop only) â”€â”€ */}
      <motion.div
        className="relative z-10 mx-auto max-w-4xl px-6 text-center"
        style={{ x: isTouch ? 0 : springX, y: isTouch ? 0 : springY }}
      >
        <motion.div
          variants={staggerContainer}
          initial={false}
          animate="visible"
        >
          {/* Underline accent */}
          <motion.div
            className="mx-auto mb-4 h-px max-w-xs"
            style={{
              background: "linear-gradient(90deg, transparent, var(--accent), var(--accent-2), transparent)",
            }}
            initial={false}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />

          {/* Role â€” character by character with blur */}
          <motion.p
            variants={fadeInUp}
            custom={2}
            className="mb-6 font-mono text-xl text-[var(--text-muted)] sm:text-2xl"
          >
            {renderRoleLine()}
          </motion.p>

          {/* Rotating tagline with typing cursor */}
          <motion.div variants={fadeInUp} custom={3} className="mb-10 h-8">
            <AnimatePresence mode="wait">
              <motion.p
                key={taglineIndex}
                initial={false}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -15, filter: "blur(8px)" }}
                transition={{ duration: 0.5 }}
                className="text-lg text-[var(--text-muted)]"
              >
                <span className="text-[var(--accent)] opacity-60 mr-1">{">"}</span>
                {taglines[taglineIndex]}
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
                  className="ml-0.5 inline-block w-[2px] h-5 bg-[var(--accent)] align-middle"
                />
              </motion.p>
            </AnimatePresence>
          </motion.div>


          {/* Social Links */}
          <motion.div
            variants={fadeInUp}
            custom={5}
            className="flex items-center justify-center gap-4"
          >
            {socialLinks.map((link, i) => (
              <MagneticButton
                key={link.label}
                as="a"
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                strength={0.5}
                aria-label={link.label}
                className="group relative rounded-full p-3 text-[var(--text-muted)] transition-all duration-300 hover:text-[var(--accent)]"
              >
                <span className="absolute inset-0 rounded-full bg-[var(--accent)] opacity-0 scale-0 group-hover:opacity-10 group-hover:scale-100 transition-all duration-500" />
                <motion.span
                  initial={false}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{
                    delay: 1.8 + i * 0.15,
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                  }}
                  className="relative block"
                >
                  {link.icon}
                </motion.span>
              </MagneticButton>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* â”€â”€ Scroll indicator â”€â”€ */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.5, duration: 0.8 }}
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2"
        >
          <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]/60">
            Scroll to explore
          </span>
          <motion.div className="relative h-9 w-5 rounded-full border border-[var(--text-muted)]/20 p-1">
            <motion.div
              className="h-2 w-full rounded-full bg-[var(--accent)]"
              animate={{ y: [0, 14, 0], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* â”€â”€ Corner decorations â”€â”€ */}
      <div className="absolute top-8 left-8 z-10 pointer-events-none hidden lg:block">
        <motion.div
          initial={false}
          animate={{ opacity: 0.15 }}
          transition={{ delay: 2 }}
          className="font-mono text-[10px] text-[var(--text-muted)] space-y-1"
        >
          <div>{data.coordinates.lat}</div>
          <div>{data.coordinates.lng}</div>
        </motion.div>
      </div>

      <div className="absolute bottom-8 right-8 z-10 pointer-events-none hidden lg:block">
        <motion.div
          initial={false}
          animate={{ opacity: 0.15 }}
          transition={{ delay: 2.2 }}
          className="font-mono text-[10px] text-[var(--text-muted)] text-right space-y-1"
        >
          <div>v1.0.0</div>
          <div>© {currentYear}</div>
        </motion.div>
      </div>
    </motion.section>
  );
}

