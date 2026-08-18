import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Plus, Check } from "lucide-react";
import { fmt, discountPct } from "../lib/api";
import { useStore } from "../context/StoreContext";
import { Stars } from "./common";

export default function ProductCard({ product, index = 0 }) {
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const [size, setSize] = useState(null);
  const [hover, setHover] = useState(false);
  const [adding, setAdding] = useState(false);
  const inWish = wishlist.ids.includes(product.id);
  const pct = discountPct(product.base_price, product.compare_at_price);
  const soldOut = (product.sizes || []).every((s) => s.stock <= 0);
  const img = product.images?.[0];
  const hoverImg = product.hover_image || product.images?.[1] || img;

  const handleAdd = async () => {
    const chosen = size || (product.sizes || []).find((s) => s.stock > 0)?.size;
    if (!chosen) return;
    setAdding(true);
    await addToCart(product.id, chosen, 1);
    setSize(chosen);
    setTimeout(() => setAdding(false), 700);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: (index % 4) * 0.06 }}
      className="group relative"
      data-testid={`product-card-${product.id}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="relative overflow-hidden rounded-2xl bg-ink-100 aspect-square">
        <Link to={`/products/${product.slug}`}>
          <motion.img
            src={img}
            alt={product.name}
            data-testid={`product-card-image-${product.id}`}
            className="absolute inset-0 h-full w-full object-cover"
            animate={{ opacity: hover ? 0 : 1, scale: hover ? 1.04 : 1 }}
            transition={{ duration: 0.4 }}
            loading="lazy"
          />
          <motion.img
            src={hoverImg}
            alt={product.name}
            className="absolute inset-0 h-full w-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: hover ? 1 : 0, scale: hover ? 1.04 : 1 }}
            transition={{ duration: 0.4 }}
            loading="lazy"
          />
        </Link>

        {/* badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {pct > 0 && (
            <span data-testid={`product-card-badge-${product.id}`} className="bg-fire text-white font-mono text-[11px] font-bold px-2 py-1 rounded-md tracking-wide">
              -{pct}%
            </span>
          )}
          {product.is_new_arrival && (
            <span className="bg-obsidian text-white font-mono text-[11px] font-bold px-2 py-1 rounded-md tracking-wide">NEW</span>
          )}
        </div>

        {/* wishlist */}
        <button
          onClick={() => toggleWishlist(product.id)}
          data-testid={`product-card-wishlist-btn-${product.id}`}
          className="absolute top-3 right-3 h-9 w-9 grid place-items-center rounded-full bg-white/90 backdrop-blur shadow-sm hover:bg-white transition-colors"
          aria-label="wishlist"
        >
          <motion.span animate={inWish ? { scale: [1, 1.35, 1] } : {}} transition={{ duration: 0.35 }}>
            <Heart size={17} className={inWish ? "fill-fire text-fire" : "text-obsidian"} />
          </motion.span>
        </button>

        {soldOut && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] grid place-items-center">
            <span className="font-display font-black uppercase tracking-widest text-obsidian border-2 border-obsidian px-4 py-2 rotate-[-6deg]">Sold Out</span>
          </div>
        )}

        {/* size chips + add */}
        {!soldOut && (
          <AnimatePresence>
            {hover && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute bottom-0 inset-x-0 p-3 hidden md:block"
              >
                <div className="flex flex-wrap gap-1.5 justify-center mb-2">
                  {(product.sizes || []).map((s) => (
                    <button
                      key={s.size}
                      disabled={s.stock <= 0}
                      onClick={() => setSize(s.size)}
                      data-testid={`product-card-size-${s.size}-${product.id}`}
                      className={`h-7 min-w-[28px] px-1 rounded-md text-xs font-mono font-bold transition-all ${
                        size === s.size ? "bg-obsidian text-white" : s.stock <= 0 ? "bg-white/50 text-ink-200 line-through cursor-not-allowed" : "bg-white/95 text-obsidian hover:bg-fire hover:text-white"
                      }`}
                    >
                      {s.size}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleAdd}
                  data-testid={`product-card-add-btn-${product.id}`}
                  className="w-full bg-obsidian text-white font-display font-bold uppercase tracking-wide text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-fire transition-colors active:scale-[0.98]"
                >
                  {adding ? <><Check size={16} /> Added</> : <><Plus size={16} /> Quick Add</>}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* info */}
      <div className="pt-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink-400">{product.brand_slug?.replace("-", " ")}</span>
          <Stars rating={product.avg_rating} count={product.review_count} size={12} />
        </div>
        <Link to={`/products/${product.slug}`}>
          <h3 data-testid={`product-card-title-${product.id}`} className="font-display font-bold text-base tracking-tight mt-1 leading-snug line-clamp-1 hover:text-fire transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-2 mt-1.5">
          <span data-testid={`product-card-price-${product.id}`} className="font-mono font-bold text-obsidian">{fmt(product.base_price)}</span>
          {pct > 0 && (
            <span data-testid={`product-card-original-price-${product.id}`} className="font-mono text-sm text-ink-400 line-through">{fmt(product.compare_at_price)}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
