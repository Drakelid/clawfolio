"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import type { Project } from "@/lib/types";
import Tilt3DCard from "@/components/ui/Tilt3DCard";
import Tag from "@/components/ui/Tag";
import TextReveal from "@/components/ui/TextReveal";
import Marquee from "@/components/ui/Marquee";

type Category = "All" | "Frontend" | "Backend" | "Full Stack";
const categories: Category[] = ["All", "Frontend", "Backend", "Full Stack"];

export default function Projects({ projects }: { projects: Project[] }) {
  const [activeFilter, setActiveFilter] = useState<Category>("All");
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const bgX = useTransform(scrollYProgress, [0, 1], [-50, 50]);

  const filtered =
    activeFilter === "All"
      ? projects
      : projects.filter((p) => p.category === activeFilter);

  const featured = filtered.filter((p) => p.featured);
  const rest = filtered.filter((p) => !p.featured);
  const allTech = [...new Set(projects.flatMap((p) => p.tags))];

  return (
    <section id="projects" className="relative py-20 md:py-32 overflow-hidden" ref={sectionRef}>
      {/* Parallax background */}
      <motion.div
        className="absolute top-40 left-1/2 h-80 w-80 rounded-full bg-[var(--accent-2)] opacity-[0.03] blur-[120px]"
        style={{ x: bgX }}
      />

      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.span variants={fadeInUp} custom={0} className="section-label mb-2 block">
            Featured Work
          </motion.span>
          <TextReveal className="mb-4 font-mono text-3xl font-bold text-[var(--text-primary)] sm:text-4xl md:text-5xl">
            Projects
          </TextReveal>
          <motion.p
            variants={fadeInUp}
            custom={2}
            className="mb-12 max-w-2xl text-lg text-[var(--text-muted)]"
          >
            A selection of projects that showcase my range across the stack.
          </motion.p>

          {/* Filter bar */}
          <motion.div variants={fadeInUp} custom={3} className="relative mb-12 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <motion.button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                data-cursor="pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative rounded-full px-5 py-2 font-mono text-sm transition-all duration-300 ${
                  activeFilter === cat
                    ? "text-white"
                    : "glass text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                {activeFilter === cat && (
                  <motion.div
                    layoutId="filter-bg"
                    className="absolute inset-0 rounded-full bg-[var(--accent)] shadow-lg shadow-[var(--accent-glow)]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{cat}</span>
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        {/* Featured rows */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFilter}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {featured.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="mb-14 sm:mb-20 grid items-center gap-8 sm:gap-10 md:grid-cols-2"
              >
                {/* Image side */}
                <Tilt3DCard
                  tiltStrength={8}
                  className={`group rounded-xl overflow-hidden ${i % 2 === 1 ? "md:order-2" : ""}`}
                >
                  <div
                    className="absolute -inset-4 rounded-2xl opacity-0 blur-2xl transition-all duration-700 group-hover:opacity-30 pointer-events-none"
                    style={{ background: project.accent }}
                  />
                  <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]">
                    {/* Browser chrome mockup */}
                    <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
                      <motion.div whileHover={{ scale: 1.3 }} className="h-3 w-3 rounded-full bg-red-500/60 cursor-pointer" />
                      <motion.div whileHover={{ scale: 1.3 }} className="h-3 w-3 rounded-full bg-yellow-500/60 cursor-pointer" />
                      <motion.div whileHover={{ scale: 1.3 }} className="h-3 w-3 rounded-full bg-green-500/60 cursor-pointer" />
                      <div className="ml-3 flex-1 min-w-0 overflow-hidden rounded bg-[var(--surface)] px-3 py-1 font-mono text-xs text-[var(--text-muted)]">
                        <motion.span
                          initial={{ width: 0 }}
                          whileInView={{ width: "auto" }}
                          viewport={{ once: true }}
                          className="inline-block max-w-full overflow-hidden whitespace-nowrap"
                        >
                          {project.links.live}
                        </motion.span>
                      </div>
                    </div>
                    {/* Image area with hover zoom and scan line effect */}
                    <div
                      className="relative flex h-64 items-center justify-center overflow-hidden"
                      data-cursor="pointer"
                      data-cursor-label="View"
                      style={{
                        background: `linear-gradient(135deg, ${project.accent}22, ${project.accent}08)`,
                      }}
                    >
                      <motion.span
                        className="font-mono text-6xl font-bold opacity-20"
                        style={{ color: project.accent }}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {String(project.id).padStart(2, "0")}
                      </motion.span>
                      {/* Scan line on hover */}
                      <motion.div
                        className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-0 group-hover:opacity-60"
                        animate={{ top: ["0%", "100%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                  </div>
                </Tilt3DCard>

                {/* Text side */}
                <motion.div
                  className={i % 2 === 1 ? "md:order-1" : ""}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  <motion.span
                    className="font-mono text-5xl sm:text-7xl font-bold opacity-10 block"
                    style={{ color: project.accent }}
                    whileHover={{ opacity: 0.2, x: 10 }}
                  >
                    {String(project.id).padStart(2, "0")}
                  </motion.span>
                  <h3 className="-mt-6 sm:-mt-8 mb-3 font-mono text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                    {project.title}
                  </h3>
                  <p className="mb-4 text-[var(--text-muted)] leading-relaxed">
                    {project.description}
                  </p>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {project.tags.map((tag, j) => (
                      <motion.div
                        key={tag}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + j * 0.05 }}
                      >
                        <Tag color={project.accent}>{tag}</Tag>
                      </motion.div>
                    ))}
                  </div>
                  <div className="flex gap-4">
                    <motion.a
                      href={project.links.live}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-cursor="pointer"
                      className="group/link font-mono text-sm text-[var(--accent)] transition-colors hover:text-[var(--accent-2)]"
                      whileHover={{ x: 4 }}
                    >
                      Live Demo <span className="inline-block transition-transform group-hover/link:translate-x-1">→</span>
                    </motion.a>
                    <motion.a
                      href={project.links.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-cursor="pointer"
                      className="group/link font-mono text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
                      whileHover={{ x: 4 }}
                    >
                      Source Code <span className="inline-block transition-transform group-hover/link:translate-x-1">→</span>
                    </motion.a>
                  </div>
                </motion.div>
              </motion.div>
            ))}

            {/* Bento grid with 3D tilt */}
            {rest.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((project, i) => (
                  <Tilt3DCard
                    key={project.id}
                    tiltStrength={12}
                    className={`glass group rounded-xl p-6 ${i === 0 ? "sm:col-span-2" : ""}`}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                    >
                      {/* Animated gradient border on hover */}
                      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="absolute inset-[-1px] rounded-xl animated-border-sweep" style={{ "--sweep-color": project.accent } as React.CSSProperties} />
                      </div>
                      {/* Thumbnail */}
                      <div
                        className="relative mb-4 flex h-40 items-center justify-center rounded-lg overflow-hidden"
                        data-cursor="pointer"
                        data-cursor-label="Open"
                        style={{
                          background: `linear-gradient(135deg, ${project.accent}22, ${project.accent}08)`,
                        }}
                      >
                        <motion.span
                          className="font-mono text-5xl font-bold opacity-20"
                          style={{ color: project.accent }}
                          whileHover={{ scale: 1.2, rotate: -5 }}
                        >
                          {String(project.id).padStart(2, "0")}
                        </motion.span>
                        {/* Gradient sweep on hover */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                        />
                      </div>
                      <h3 className="mb-2 font-mono text-lg font-bold text-[var(--text-primary)]">
                        {project.title}
                      </h3>
                      <p className="mb-3 text-sm text-[var(--text-muted)] line-clamp-2">
                        {project.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {project.tags.slice(0, 3).map((tag) => (
                          <Tag key={tag} color={project.accent}>
                            {tag}
                          </Tag>
                        ))}
                      </div>
                    </motion.div>
                  </Tilt3DCard>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Tech marquee strip */}
        <div className="mt-20 -mx-6 overflow-hidden border-y border-[var(--border)] py-4">
          <Marquee speed={25} pauseOnHover>
            {allTech.map((tech) => (
              <span
                key={tech}
                className="whitespace-nowrap font-mono text-sm text-[var(--text-muted)]/40 px-4"
              >
                {tech}
              </span>
            ))}
          </Marquee>
        </div>
      </div>
    </section>
  );
}
