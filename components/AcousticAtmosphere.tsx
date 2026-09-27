"use client";

import React, { useEffect, useRef } from "react";

export function AcousticAtmosphere({ opacity = 0.22 }: { opacity?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Check accessibility: prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      if (prefersReducedMotion) {
        renderStatic();
      }
    };

    window.addEventListener("resize", handleResize);

    // Particle nodes representing acoustic air molecules / standing wave energy
    const particleCount = Math.min(48, Math.floor(width / 30));
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      baseX: Math.random() * width,
      baseY: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      frequency: Math.random() * 0.002 + 0.001,
      phase: Math.random() * Math.PI * 2,
      amplitude: Math.random() * 24 + 8,
      alpha: Math.random() * 0.4 + 0.2,
    }));

    let time = 0;

    const renderStatic = () => {
      ctx.clearRect(0, 0, width, height);

      // Subtle dark vignette
      const gradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        height * 0.2,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.75
      );
      gradient.addColorStop(0, "rgba(13, 12, 10, 0)");
      gradient.addColorStop(1, "rgba(13, 12, 10, 0.85)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    };

    const render = () => {
      time += 0.008;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw subtle harmonic wave interference lines
      const waveCount = 3;
      for (let w = 0; w < waveCount; w++) {
        ctx.beginPath();
        const baseHeight = height * (0.35 + w * 0.15);
        const waveFreq = 0.0015 + w * 0.0008;
        const waveAmp = 28 - w * 6;

        ctx.moveTo(0, baseHeight);
        for (let x = 0; x < width; x += 12) {
          // Standing wave formula: sin(kx - wt) * cos(kx + wt)
          const y =
            baseHeight +
            Math.sin(x * waveFreq + time * (1 + w * 0.5)) *
              Math.cos(x * waveFreq * 0.5 - time * 0.7) *
              waveAmp;
          ctx.lineTo(x, y);
        }

        // StoryLab Palette: subtle warm amber / muted paper strokes
        ctx.strokeStyle =
          w === 0
            ? "rgba(201, 164, 107, 0.08)" // StoryLab Amber
            : "rgba(237, 233, 225, 0.04)"; // Warm Paper
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 2. Draw acoustic floating pressure nodes (subtle particles)
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x = p.baseX + Math.sin(time * 0.8 + p.phase) * p.amplitude;
        p.y = p.baseY + Math.cos(time * 0.5 + p.phase) * (p.amplitude * 0.6);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201, 164, 107, ${p.alpha * 0.6})`;
        ctx.fill();
      }

      // 3. Subtle dark vignette around edges
      const gradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        height * 0.2,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.75
      );
      gradient.addColorStop(0, "rgba(13, 12, 10, 0)");
      gradient.addColorStop(1, "rgba(13, 12, 10, 0.85)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      animationFrameId = requestAnimationFrame(render);
    };

    if (prefersReducedMotion) {
      renderStatic();
    } else {
      render();
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ opacity }}
      className="fixed inset-0 pointer-events-none z-0 w-full h-full transition-opacity duration-1000"
    />
  );
}
