"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { useTheme } from "next-themes";
import { useHasMounted } from "@/lib/client-hooks";
import { cn } from "@/lib/utils";
import MagneticButton from "@/components/ui/MagneticButton";

const navLinks = [
  { label: "About", href: "#about" },
  { label: "Projects", href: "#projects" },
  { label: "Experience", href: "#experience" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const hasMounted = useHasMounted();

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 80);
    // Auto-hide on scroll down, show on scroll up
    if (latest > lastScrollY.current && latest > 300) {
      setHidden(true);
    } else {
      setHidden(false);
    }
    lastScrollY.current = latest;
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-40% 0px -40% 0px" }
    );

    navLinks.forEach(({ href }) => {
      const el = document.querySelector(href);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <motion.nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-colors duration-500",
          scrolled
            ? "glass bg-[var(--bg-primary)]/60 shadow-lg shadow-black/5"
            : "bg-transparent"
        )}
        animate={{ y: hidden ? -100 : 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          {/* Logo - magnetic */}
          <MagneticButton
            as="a"
            href="#"
            strength={0.3}
            className="font-mono text-lg font-bold text-[var(--accent)] relative group"
          >
            <span className="relative z-10">FD</span>
            <motion.span
              className="text-[var(--accent-2)]"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              .
            </motion.span>
            <span className="absolute -inset-2 rounded-lg bg-[var(--accent)] opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
          </MagneticButton>

          {/* Desktop links */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map(({ label, href }) => (
              <MagneticButton
                key={href}
                as="a"
                href={href}
                strength={0.2}
                className={cn(
                  "relative rounded-lg px-4 py-2 font-mono text-sm transition-all duration-300",
                  activeSection === href.slice(1)
                    ? "text-[var(--accent)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                )}
              >
                {activeSection === href.slice(1) && (
                  <motion.div
                    layoutId="nav-active-bg"
                    className="absolute inset-0 rounded-lg bg-[var(--accent)]/10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{label}</span>
              </MagneticButton>
            ))}

            {/* Theme toggle */}
            {hasMounted && (
              <motion.button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="relative ml-4 h-9 w-9 rounded-full text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] group overflow-hidden"
                data-cursor="pointer"
                aria-label="Toggle theme"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9, rotate: 180 }}
              >
                <span className="absolute inset-0 rounded-full bg-[var(--accent)] opacity-0 group-hover:opacity-10 transition-opacity" />
                <AnimatePresence mode="wait">
                  {theme === "dark" ? (
                    <motion.svg
                      key="sun"
                      initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                      transition={{ duration: 0.3 }}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-5 w-5 absolute inset-0 m-auto"
                    >
                      <circle cx="12" cy="12" r="5" />
                      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                    </motion.svg>
                  ) : (
                    <motion.svg
                      key="moon"
                      initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                      transition={{ duration: 0.3 }}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-5 w-5 absolute inset-0 m-auto"
                    >
                      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                    </motion.svg>
                  )}
                </AnimatePresence>
              </motion.button>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="flex flex-col gap-1.5 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            data-cursor="pointer"
          >
            <motion.span
              animate={mobileOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
              className="block h-0.5 w-6 bg-[var(--text-primary)] origin-center"
            />
            <motion.span
              animate={mobileOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
              className="block h-0.5 w-6 bg-[var(--text-primary)]"
            />
            <motion.span
              animate={mobileOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
              className="block h-0.5 w-6 bg-[var(--text-primary)] origin-center"
            />
          </button>
        </div>
      </motion.nav>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 bg-[var(--bg-primary)]/95 backdrop-blur-lg md:hidden"
          >
            {/* Decorative background number */}
            <motion.span
              className="absolute font-mono text-[20rem] font-bold text-[var(--accent)] opacity-[0.02] select-none"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.02 }}
              exit={{ scale: 0.5, opacity: 0 }}
            >
              FD
            </motion.span>

            {navLinks.map(({ label, href }, i) => (
              <motion.a
                key={href}
                href={href}
                initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                onClick={() => setMobileOpen(false)}
                className="font-mono text-3xl text-[var(--text-primary)] transition-colors hover:text-[var(--accent)]"
              >
                <span className="text-[var(--accent)] text-sm mr-2">0{i + 1}</span>
                {label}
              </motion.a>
            ))}
            {hasMounted && (
              <motion.button
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                transition={{ delay: 0.4 }}
                onClick={() => {
                  setTheme(theme === "dark" ? "light" : "dark");
                  setMobileOpen(false);
                }}
                className="mt-4 rounded-full border border-[var(--border)] px-6 py-2 font-mono text-lg text-[var(--text-muted)]"
              >
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
