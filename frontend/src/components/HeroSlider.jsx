import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { optimizeImg } from "../lib/api";

export default function HeroSlider({ slides = [] }) {
  const { user } = useStore();
  const [idx, setIdx] = useState(0);
  const [hasMounted, setHasMounted] = useState(false);
  const n = slides.length;

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const next = useCallback(() => setIdx((i) => (i + 1) % Math.max(1, n)), [n]);

  useEffect(() => {
    if (n <= 1) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [next, n, idx]);

  if (!n) return <div className="skeleton w-full h-[calc(100svh-4.5rem)] min-h-[580px] max-h-[920px]" />;
  const s = slides[idx];
  const optimizedHero = optimizeImg(s.image_url, { width: 1400 });

  return (
    <section
      className="relative w-full h-[calc(100svh-4.5rem)] min-h-[580px] max-h-[920px] overflow-hidden bg-obsidian"
      data-testid="hero-slider"
    >
      <AnimatePresence mode="sync">
        <motion.div
          key={s.id || idx}
          initial={hasMounted ? { opacity: 0, scale: 1.05 } : false}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <img
            src={optimizedHero}
            alt={s.title}
            className="h-full w-full object-cover object-center"
            loading="eager"
            fetchPriority={idx === 0 ? "high" : "auto"}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-obsidian/90 via-obsidian/50 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 h-full max-w-[1400px] mx-auto px-5 sm:px-8 pb-12 sm:pb-0 flex flex-col justify-center">
        <motion.div
          key={`c-${idx}`}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="max-w-2xl xl:max-w-3xl"
        >
          {s.badge && (
            <span className="inline-block bg-fire text-white font-mono text-[11px] font-bold tracking-[0.2em] px-3 py-1.5 rounded-none mb-5">
              {s.badge}
            </span>
          )}
          <h1 className="font-display text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.08] drop-shadow-lg capitalize">
            {s.title ? s.title.toLowerCase() : ""}
          </h1>
          <p className="text-white/90 mt-5 text-base sm:text-lg lg:text-xl max-w-lg lg:max-w-xl leading-relaxed drop-shadow-md font-medium">
            {s.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to={s.link || s.link_url || "/shop"}
              className="group inline-flex items-center gap-3 bg-fire text-white font-display tracking-wider text-sm px-7 py-4 rounded-none hover:bg-white hover:text-obsidian shadow-lg transition-colors"
            >
              {s.button_text || s.cta_text || "Shop Now"}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            {user ? (
              <Link
                to={user.role === "admin" || user.role === "staff" ? "/admin" : "/account"}
                className="inline-flex items-center justify-center bg-transparent border-2 border-white/80 text-white font-display tracking-wider text-sm px-7 py-3.5 rounded-none hover:bg-white hover:text-obsidian shadow-lg transition-colors backdrop-blur-sm"
              >
                {user.role === "admin" || user.role === "staff" ? "Admin Portal" : "My Account"}
              </Link>
            ) : (
              <Link
                to="/new-arrivals"
                className="inline-flex items-center justify-center bg-transparent border-2 border-white/80 text-white font-display tracking-wider text-sm px-7 py-3.5 rounded-none hover:bg-white hover:text-obsidian shadow-lg transition-colors backdrop-blur-sm"
              >
                New Drops
              </Link>
            )}
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

