"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { getProjectGallery } from "@/lib/project-utils";
import type { Project } from "@/lib/types";
import Tilt3DCard from "@/components/ui/Tilt3DCard";
import Tag from "@/components/ui/Tag";
import TextReveal from "@/components/ui/TextReveal";
import Marquee from "@/components/ui/Marquee";

type Category = "All" | "Frontend" | "Backend" | "Full Stack";
const categories: Category[] = ["All", "Frontend", "Backend", "Full Stack"];

function ProjectPreview({
  project,
  src,
  alt,
  className,
  imageClassName,
  children,
}: {
  project: Project;
  src?: string;
  alt: string;
  className: string;
  imageClassName?: string;
  children?: ReactNode;
}) {
  const imageSrc = typeof src === "string" ? src.trim() : "";
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const hasImage = imageSrc.length > 0 && failedSrc !== imageSrc;

  return (
    <div
      className={className}
      style={{
        background: `linear-gradient(135deg, ${project.accent}22, ${project.accent}08)`,
      }}
    >
      {hasImage ? (
        <img
          key={imageSrc}
          src={imageSrc}
          alt={alt}
          className={imageClassName ?? "h-full w-full object-cover"}
          onError={() => setFailedSrc(imageSrc)}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
          <span
            className="font-mono text-5xl font-bold opacity-20"
            style={{ color: project.accent }}
          >
            {String(project.id).padStart(2, "0")}
          </span>
          <div className="max-w-[16rem] rounded-full border border-white/10 bg-black/20 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/70">
            {imageSrc || "Add preview image"}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

function FeaturedProjectCard({
  project,
  index,
  onOpenGallery,
}: {
  project: Project;
  index: number;
  onOpenGallery: (project: Project, index?: number) => void;
}) {
  const gallery = getProjectGallery(project);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="mb-14 grid items-center gap-8 sm:mb-20 sm:gap-10 md:grid-cols-2"
    >
      <Tilt3DCard
        tiltStrength={8}
        className={`group rounded-xl overflow-hidden ${index % 2 === 1 ? "md:order-2" : ""}`}
      >
        <div
          className="pointer-events-none absolute -inset-4 rounded-2xl opacity-0 blur-2xl transition-all duration-700 group-hover:opacity-30"
          style={{ background: project.accent }}
        />
        <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
            <motion.div whileHover={{ scale: 1.3 }} className="h-3 w-3 rounded-full bg-red-500/60 cursor-pointer" />
            <motion.div whileHover={{ scale: 1.3 }} className="h-3 w-3 rounded-full bg-yellow-500/60 cursor-pointer" />
            <motion.div whileHover={{ scale: 1.3 }} className="h-3 w-3 rounded-full bg-green-500/60 cursor-pointer" />
            <div className="ml-3 min-w-0 flex-1 overflow-hidden rounded bg-[var(--surface)] px-3 py-1 font-mono text-xs text-[var(--text-muted)]">
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

          <button
            type="button"
            onClick={() => onOpenGallery(project, 0)}
            disabled={gallery.length === 0}
            className="block w-full text-left disabled:cursor-default"
            data-cursor="pointer"
            data-cursor-label="View"
          >
            <ProjectPreview
              project={project}
              src={gallery[0]}
              alt={`${project.title} cover preview`}
              className="relative h-64 overflow-hidden"
              imageClassName="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            >
              <motion.div
                className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-0 group-hover:opacity-60"
                animate={{ top: ["0%", "100%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
              <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/30 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/70">
                {gallery.length} preview{gallery.length === 1 ? "" : "s"}
              </div>
            </ProjectPreview>
          </button>

          <div className="grid grid-cols-3 gap-2 border-t border-[var(--border)] p-3">
            {gallery.slice(0, 3).map((image, imageIndex) => (
              <button
                key={`${image}-${imageIndex}`}
                type="button"
                onClick={() => onOpenGallery(project, imageIndex)}
                className="block overflow-hidden rounded-lg border border-[var(--border)]"
                data-cursor="pointer"
              >
                <ProjectPreview
                  project={project}
                  src={image}
                  alt={`${project.title} thumbnail ${imageIndex + 1}`}
                  className="relative h-16 overflow-hidden"
                  imageClassName="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                >
                  <div className="absolute inset-0 bg-black/10" />
                </ProjectPreview>
              </button>
            ))}

            {gallery.length === 0 && (
              <div className="col-span-3 rounded-lg border border-dashed border-[var(--border)] px-3 py-4 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Add preview images in the CMS
              </div>
            )}
          </div>
        </div>
      </Tilt3DCard>

      <motion.div
        className={index % 2 === 1 ? "md:order-1" : ""}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <motion.span
          className="block font-mono text-5xl font-bold opacity-10 sm:text-7xl"
          style={{ color: project.accent }}
          whileHover={{ opacity: 0.2, x: 10 }}
        >
          {String(project.id).padStart(2, "0")}
        </motion.span>
        <h3 className="-mt-6 mb-3 font-mono text-xl font-bold text-[var(--text-primary)] sm:-mt-8 sm:text-2xl">
          {project.title}
        </h3>
        <p className="mb-4 leading-relaxed text-[var(--text-muted)]">
          {project.description}
        </p>
        <div className="mb-4 flex flex-wrap gap-2">
          {project.tags.map((tag, tagIndex) => (
            <motion.div
              key={tag}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + tagIndex * 0.05 }}
            >
              <Tag color={project.accent}>{tag}</Tag>
            </motion.div>
          ))}
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <motion.a
            href={project.links.live}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="pointer"
            className="group/link font-mono text-sm text-[var(--accent)] transition-colors hover:text-[var(--accent-2)]"
            whileHover={{ x: 4 }}
          >
            Live Demo <span className="inline-block transition-transform group-hover/link:translate-x-1">-&gt;</span>
          </motion.a>
          <motion.a
            href={project.links.github}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="pointer"
            className="group/link font-mono text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
            whileHover={{ x: 4 }}
          >
            Source Code <span className="inline-block transition-transform group-hover/link:translate-x-1">-&gt;</span>
          </motion.a>
          {gallery.length > 0 && (
            <button
              type="button"
              onClick={() => onOpenGallery(project, 0)}
              className="rounded-full border border-[var(--border)] px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
            >
              View Gallery ({gallery.length})
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function CompactProjectCard({
  project,
  index,
  onOpenGallery,
}: {
  project: Project;
  index: number;
  onOpenGallery: (project: Project, index?: number) => void;
}) {
  const gallery = getProjectGallery(project);

  return (
    <Tilt3DCard
      tiltStrength={12}
      className={`glass group rounded-xl p-6 ${index === 0 ? "sm:col-span-2" : ""}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1, duration: 0.5 }}
      >
        <div className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <div
            className="absolute inset-[-1px] rounded-xl animated-border-sweep"
            style={{ "--sweep-color": project.accent } as CSSProperties}
          />
        </div>
        <button
          type="button"
          onClick={() => onOpenGallery(project, 0)}
          disabled={gallery.length === 0}
          className="block w-full text-left disabled:cursor-default"
          data-cursor="pointer"
          data-cursor-label="Open"
        >
          <ProjectPreview
            project={project}
            src={gallery[0]}
            alt={`${project.title} preview`}
            className="relative mb-4 h-40 overflow-hidden rounded-lg"
            imageClassName="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          >
            <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full transition-transform duration-1000 group-hover:translate-x-full" />
            <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/25 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/70">
              {gallery.length} preview{gallery.length === 1 ? "" : "s"}
            </div>
          </ProjectPreview>
        </button>
        <h3 className="mb-2 font-mono text-lg font-bold text-[var(--text-primary)]">
          {project.title}
        </h3>
        <p className="mb-3 line-clamp-2 text-sm text-[var(--text-muted)]">
          {project.description}
        </p>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {project.tags.slice(0, 3).map((tag) => (
            <Tag key={tag} color={project.accent}>
              {tag}
            </Tag>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onOpenGallery(project, 0)}
          disabled={gallery.length === 0}
          className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] disabled:cursor-default disabled:opacity-50"
        >
          View Gallery
        </button>
      </motion.div>
    </Tilt3DCard>
  );
}

export default function Projects({ projects }: { projects: Project[] }) {
  const [activeFilter, setActiveFilter] = useState<Category>("All");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const bgX = useTransform(scrollYProgress, [0, 1], [-50, 50]);

  const filtered =
    activeFilter === "All"
      ? projects
      : projects.filter((project) => project.category === activeFilter);

  const featured = filtered.filter((project) => project.featured);
  const rest = filtered.filter((project) => !project.featured);
  const allTech = [...new Set(projects.flatMap((project) => project.tags))];
  const selectedGallery = selectedProject ? getProjectGallery(selectedProject) : [];

  const openGallery = (project: Project, index = 0) => {
    const gallery = getProjectGallery(project);
    if (gallery.length === 0) {
      return;
    }

    setSelectedProject(project);
    setSelectedImageIndex(Math.min(index, gallery.length - 1));
  };

  const closeGallery = () => {
    setSelectedProject(null);
    setSelectedImageIndex(0);
  };

  const showPreviousImage = () => {
    setSelectedImageIndex((current) =>
      selectedGallery.length <= 1 ? current : (current - 1 + selectedGallery.length) % selectedGallery.length
    );
  };

  const showNextImage = () => {
    setSelectedImageIndex((current) =>
      selectedGallery.length <= 1 ? current : (current + 1) % selectedGallery.length
    );
  };

  useEffect(() => {
    if (!selectedProject) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedProject(null);
        setSelectedImageIndex(0);
        return;
      }

      if (event.key === "ArrowLeft" && selectedGallery.length > 1) {
        setSelectedImageIndex((current) => (current - 1 + selectedGallery.length) % selectedGallery.length);
      }

      if (event.key === "ArrowRight" && selectedGallery.length > 1) {
        setSelectedImageIndex((current) => (current + 1) % selectedGallery.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedProject, selectedGallery.length]);

  return (
    <section id="projects" className="relative overflow-hidden py-20 md:py-32" ref={sectionRef}>
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

          <motion.div variants={fadeInUp} custom={3} className="relative mb-12 flex flex-wrap gap-2">
            {categories.map((category) => (
              <motion.button
                key={category}
                onClick={() => setActiveFilter(category)}
                data-cursor="pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative rounded-full px-5 py-2 font-mono text-sm transition-all duration-300 ${
                  activeFilter === category
                    ? "text-white"
                    : "glass text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                {activeFilter === category && (
                  <motion.div
                    layoutId="filter-bg"
                    className="absolute inset-0 rounded-full bg-[var(--accent)] shadow-lg shadow-[var(--accent-glow)]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{category}</span>
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeFilter}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {featured.map((project, index) => (
              <FeaturedProjectCard
                key={project.id}
                project={project}
                index={index}
                onOpenGallery={openGallery}
              />
            ))}

            {rest.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((project, index) => (
                  <CompactProjectCard
                    key={project.id}
                    project={project}
                    index={index}
                    onOpenGallery={openGallery}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-20 -mx-6 overflow-hidden border-y border-[var(--border)] py-4">
          <Marquee speed={25} pauseOnHover>
            {allTech.map((tech) => (
              <span
                key={tech}
                className="whitespace-nowrap px-4 font-mono text-sm text-[var(--text-muted)]/40"
              >
                {tech}
              </span>
            ))}
          </Marquee>
        </div>
      </div>

      <AnimatePresence>
        {selectedProject && selectedGallery.length > 0 && (
          <motion.div
            className="fixed inset-0 z-[120] bg-black/85 px-4 py-6 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeGallery}
          >
            <div className="mx-auto flex min-h-full max-w-6xl items-center justify-center">
              <motion.div
                className="w-full overflow-hidden rounded-[2rem] border border-white/10 bg-[var(--bg-secondary)] shadow-2xl shadow-black/40"
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 24, scale: 0.97 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] px-5 py-4">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
                      Project Gallery
                    </p>
                    <h3 className="mt-1 font-mono text-xl font-bold text-[var(--text-primary)]">
                      {selectedProject.title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={closeGallery}
                    className="rounded-full border border-[var(--border)] px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
                  >
                    Close
                  </button>
                </div>

                <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_15rem]">
                  <div className="space-y-4">
                    <ProjectPreview
                      project={selectedProject}
                      src={selectedGallery[selectedImageIndex]}
                      alt={`${selectedProject.title} preview ${selectedImageIndex + 1}`}
                      className="relative aspect-[16/10] overflow-hidden rounded-[1.5rem] border border-[var(--border)]"
                      imageClassName="h-full w-full object-cover"
                    >
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 via-black/30 to-transparent px-4 py-4">
                        <div>
                          <div className="font-mono text-xs uppercase tracking-[0.2em] text-white/60">
                            Preview {selectedImageIndex + 1} / {selectedGallery.length}
                          </div>
                          <div className="mt-1 font-mono text-sm text-white/80">
                            {selectedGallery[selectedImageIndex]}
                          </div>
                        </div>

                        {selectedGallery.length > 1 && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={showPreviousImage}
                              className="rounded-full border border-white/15 bg-black/20 px-3 py-2 font-mono text-xs uppercase tracking-[0.2em] text-white/70 transition-colors hover:text-white"
                            >
                              Prev
                            </button>
                            <button
                              type="button"
                              onClick={showNextImage}
                              className="rounded-full border border-white/15 bg-black/20 px-3 py-2 font-mono text-xs uppercase tracking-[0.2em] text-white/70 transition-colors hover:text-white"
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </div>
                    </ProjectPreview>

                    <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                      {selectedProject.description}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {selectedGallery.map((image, index) => (
                      <button
                        key={`${image}-${index}`}
                        type="button"
                        onClick={() => setSelectedImageIndex(index)}
                        className={`block w-full overflow-hidden rounded-2xl border transition-colors ${
                          index === selectedImageIndex
                            ? "border-[var(--accent)]"
                            : "border-[var(--border)] hover:border-white/20"
                        }`}
                      >
                        <ProjectPreview
                          project={selectedProject}
                          src={image}
                          alt={`${selectedProject.title} thumbnail ${index + 1}`}
                          className="relative aspect-[4/3] overflow-hidden"
                          imageClassName="h-full w-full object-cover"
                        >
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-3 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-white/70">
                            Preview {index + 1}
                          </div>
                        </ProjectPreview>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
