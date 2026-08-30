import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function HeroSlider({ slides = [] }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = slides.length;

  const next = useCallback(() => setIdx((i) => (i + 1) % Math.max(1, n)), [n]);

  useEffect(() => {
    if (paused || n <= 1) return;
    const id = setInterval(next, 5500);
    return () => clearInterval(id);
  }, [paused, next, n]);

  if (!n) return <div className="skeleton w-full h-[70vh]" />;
  const s = slides[idx];

  return (
    <section
      className="relative w-full h-[78vh] min-h-[520px] overflow-hidden bg-obsidian"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      data-testid="hero-slider"
    >
      <AnimatePresence mode="sync">
        <motion.div
          key={s.id || idx}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <img src={s.image_url} alt={s.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-obsidian/90 via-obsidian/50 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 h-full max-w-[1400px] mx-auto px-5 sm:px-8 flex flex-col justify-center">
        <motion.div
          key={`c-${idx}`}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="max-w-2xl"
        >
          {s.badge && (
            <span className="inline-block bg-fire text-white font-mono text-[11px] font-bold  tracking-[0.2em] px-3 py-1.5 rounded-none mb-5">
              {s.badge}
            </span>
          )}
          <h1 className="font-display text-white text-2xl sm:text-2xl lg:text-6xl font-bold tracking-tight leading-[1.1] drop-shadow-lg capitalize">
            {s.title ? s.title.toLowerCase() : ""}
          </h1>
          <p className="text-white/90 mt-5 text-base sm:text-lg max-w-lg leading-relaxed drop-shadow-md font-medium">
            {s.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to={s.link_url || "/shop"}
              className="group inline-flex items-center gap-3 bg-fire text-white font-display tracking-wider text-sm px-7 py-4 rounded-none hover:bg-white hover:text-obsidian shadow-lg transition-colors"
            >
              {s.cta_text || "Shop Now"}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center bg-transparent border-2 border-white/80 text-white font-display tracking-wider text-sm px-7 py-3.5 rounded-none hover:bg-white hover:text-obsidian shadow-lg transition-colors backdrop-blur-sm"
            >
              Sign Up
            </Link>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className="h-1.5 rounded-none transition-all duration-500"
            style={{ width: i === idx ? 40 : 14, background: i === idx ? "#FF3B30" : "rgba(255,255,255,0.5)" }}
            aria-label={`slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

