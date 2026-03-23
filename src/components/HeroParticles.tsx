"use client";

import { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";

const options: ISourceOptions = {
  fullScreen: false,
  fpsLimit: 60,
  particles: {
    number: { value: 60, density: { enable: true } },
    color: { value: ["#3B82F6", "#8B5CF6", "#06B6D4"] },
    opacity: {
      value: { min: 0.1, max: 0.4 },
      animation: { enable: true, speed: 0.5, sync: false },
    },
    size: {
      value: { min: 1, max: 3 },
    },
    move: {
      enable: true,
      speed: 0.6,
      direction: "top",
      outModes: { default: "out" },
      random: true,
      straight: false,
    },
    links: {
      enable: true,
      distance: 120,
      color: "#3B82F6",
      opacity: 0.08,
      width: 1,
    },
  },
  interactivity: {
    events: {
      onHover: {
        enable: true,
        mode: ["grab", "bubble"],
      },
      onClick: {
        enable: true,
        mode: "push",
      },
    },
    modes: {
      grab: {
        distance: 150,
        links: { opacity: 0.3, color: "#8B5CF6" },
      },
      bubble: {
        distance: 200,
        size: 6,
        duration: 0.4,
        opacity: 0.6,
      },
      push: {
        quantity: 3,
      },
    },
  },
  detectRetina: true,
};

export default function HeroParticles() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setReady(true));
  }, []);

  if (!ready) return null;

  return (
    <Particles
      id="hero-particles"
      options={options}
      className="absolute inset-0 z-[1]"
    />
  );
}
