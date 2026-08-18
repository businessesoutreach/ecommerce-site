import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

export const ScrollReveal = ({ children, delay = 0, y = 28, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

export const SectionHeader = ({ eyebrow, title, tagline, action }) => (
  <div className="flex items-end justify-between gap-4 mb-8">
    <div>
      {eyebrow && (
        <div className="flex items-center gap-2 mb-3">
          <span className="h-[2px] w-8 bg-fire" />
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-fire font-bold">{eyebrow}</span>
        </div>
      )}
      <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold uppercase tracking-tight leading-none">{title}</h2>
      {tagline && <p className="text-ink-500 mt-2 text-sm sm:text-base max-w-xl">{tagline}</p>}
    </div>
    {action}
  </div>
);

export const Stars = ({ rating = 5, size = 14, count }) => (
  <div className="flex items-center gap-1">
    <div className="flex">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} className={i <= Math.round(rating) ? "fill-fire text-fire" : "fill-ink-200 text-ink-200"} />
      ))}
    </div>
    {count != null && <span className="font-mono text-xs text-ink-400">({count})</span>}
  </div>
);

export const ProductCardSkeleton = () => (
  <div className="space-y-3">
    <div className="skeleton aspect-square rounded-2xl" />
    <div className="skeleton h-3 w-1/3 rounded" />
    <div className="skeleton h-4 w-3/4 rounded" />
    <div className="skeleton h-4 w-1/2 rounded" />
  </div>
);

export const Countdown = ({ endsAt }) => {
  const [t, setT] = useState(calc(endsAt));
  function calc(e) {
    const diff = Math.max(0, new Date(e).getTime() - Date.now());
    return {
      h: Math.floor(diff / 3.6e6),
      m: Math.floor((diff % 3.6e6) / 6e4),
      s: Math.floor((diff % 6e4) / 1000),
    };
  }
  useEffect(() => {
    const id = setInterval(() => setT(calc(endsAt)), 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  const Box = ({ v, l }) => (
    <div className="flex flex-col items-center">
      <div className="bg-obsidian text-white font-mono text-lg sm:text-2xl font-bold w-12 sm:w-16 h-12 sm:h-16 flex items-center justify-center rounded-lg tabular-nums">
        {String(v).padStart(2, "0")}
      </div>
      <span className="text-[10px] uppercase tracking-widest text-ink-400 mt-1 font-bold">{l}</span>
    </div>
  );
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Box v={t.h} l="Hrs" />
      <span className="font-display font-black text-fire text-xl">:</span>
      <Box v={t.m} l="Min" />
      <span className="font-display font-black text-fire text-xl">:</span>
      <Box v={t.s} l="Sec" />
    </div>
  );
};

export const EmptyState = ({ icon: Icon, title, subtitle, action }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    {Icon && <Icon size={48} className="text-ink-200 mb-5" strokeWidth={1.2} />}
    <h3 className="font-display text-xl font-bold uppercase tracking-tight">{title}</h3>
    {subtitle && <p className="text-ink-500 mt-2 max-w-sm">{subtitle}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);
