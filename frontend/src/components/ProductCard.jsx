import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Plus, Check, Loader2, Eye } from "lucide-react";
import { fmt, discountPct, optimizeImg } from "../lib/api";
import { useStore } from "../context/StoreContext";
import { Stars } from "./common";

export default function ProductCard({ product, index = 0, onQuickView, layout = "grid" }) {
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const [size, setSize] = useState(null);
  const [hover, setHover] = useState(false);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [togglingWishlist, setTogglingWishlist] = useState(false);
  const inWish = wishlist.ids.includes(product.id);
  const pct = discountPct(product.base_price, product.compare_at_price);
  const soldOut = (product.sizes || []).every((s) => s.stock <= 0);
  const totalStock = (product.sizes || []).reduce((acc, s) => acc + (s.stock || 0), 0);
  const lowStock = !soldOut && totalStock > 0 && totalStock <= 6;
  const rawImg = product.images?.[0] || product.image_url;
  const rawHoverImg = product.hover_image || product.images?.[1] || rawImg;
  const img = optimizeImg(rawImg, { width: 600 });
  const hoverImg = optimizeImg(rawHoverImg, { width: 600 });

  const handleAdd = async () => {
    const chosen = size || (product.sizes || []).find((s) => s.stock > 0)?.size;
    if (!chosen) return;
    setAdding(true);
    await addToCart(product.id, chosen, 1);
    setAdding(false);
    setAdded(true);
    setSize(chosen);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    setTogglingWishlist(true);
    await toggleWishlist(product.id);
    setTogglingWishlist(false);
  };

  // 👟 Horizontal (Row/List) Card Layout
  if (layout === "horizontal" || layout === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: (index % 4) * 0.05 }}
        className="group relative bg-white border border-ink-200 hover:border-obsidian transition-colors duration-200 p-3 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-6 shadow-sm"
        data-testid={`product-card-${product.id}`}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {/* Left: Image Container */}
        <div className="relative overflow-hidden bg-ink-100 aspect-square w-full sm:w-48 md:w-56 shrink-0 border border-ink-200 group-hover:border-obsidian transition-colors">
          <Link to={`/products/${product.slug}`}>
            <motion.img
              src={img}
              alt={product.name}
              data-testid={`product-card-image-${product.id}`}
              className="absolute inset-0 h-full w-full object-cover"
              animate={{ opacity: hover ? 0 : 1, scale: hover ? 1.05 : 1 }}
              transition={{ duration: 0.5 }}
              loading="lazy"
            />
            <motion.img
              src={hoverImg}
              alt={product.name}
              className="absolute inset-0 h-full w-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: hover ? 1 : 0, scale: hover ? 1.05 : 1 }}
              transition={{ duration: 0.5 }}
              loading="lazy"
            />
          </Link>

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
            {pct > 0 && (
              <span className="bg-fire text-white font-mono text-[10px] font-bold px-2 py-0.5 tracking-wider shadow-sm">
                -{pct}%
              </span>
            )}
            {product.is_new_arrival && (
              <span className="bg-obsidian text-white font-mono text-[10px] font-bold px-2 py-0.5 tracking-wider shadow-sm">
                NEW
              </span>
            )}
            {lowStock && !pct && (
              <span className="bg-amber-600 text-white font-mono text-[10px] font-bold px-2 py-0.5 tracking-wider shadow-sm">
                FEW LEFT
              </span>
            )}
          </div>

          {soldOut && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] grid place-items-center z-10">
              <span className="font-display tracking-widest text-obsidian border-2 border-obsidian px-3 py-1.5 text-xs font-bold">
                Sold Out
              </span>
            </div>
          )}
        </div>

        {/* Right: Product Details & Actions */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            {/* Top row: Brand & Rating */}
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-400 font-bold truncate">
                {product.brand_slug?.replace("-", " ") || "Sneakers"}
              </span>
              <Stars rating={product.avg_rating} count={product.review_count} size={13} />
            </div>

            {/* Title */}
            <Link to={`/products/${product.slug}`}>
              <h3
                data-testid={`product-card-title-${product.id}`}
                className="font-display font-bold text-base sm:text-lg lg:text-xl tracking-tight mt-1 text-obsidian hover:text-fire transition-colors line-clamp-1 sm:line-clamp-2"
              >
                {product.name}
              </h3>
            </Link>

            {/* Price */}
            <div className="flex items-center gap-2.5 mt-2">
              <span
                data-testid={`product-card-price-${product.id}`}
                className="font-mono font-bold text-lg sm:text-xl text-obsidian"
              >
                {fmt(product.base_price)}
              </span>
              {pct > 0 && (
                <>
                  <span
                    data-testid={`product-card-original-price-${product.id}`}
                    className="font-mono text-sm text-ink-400 line-through"
                  >
                    {fmt(product.compare_at_price)}
                  </span>
                  <span className="text-fire font-mono text-xs font-bold">
                    Save {fmt(product.compare_at_price - product.base_price)}
                  </span>
                </>
              )}
            </div>

            {/* Description or details preview if present */}
            {product.description && (
              <p className="hidden sm:block text-xs font-mono text-ink-500 mt-2 line-clamp-2 leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Sizes */}
            {!soldOut && (
              <div className="mt-3.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-ink-400 font-bold mb-1.5">
                  Select Size (EU) {size && <span className="text-fire font-bold">: {size}</span>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(product.sizes || []).map((s) => (
                    <button
                      key={s.size}
                      disabled={s.stock <= 0}
                      onClick={() => setSize(s.size)}
                      data-testid={`product-card-size-${s.size}-${product.id}`}
                      className={`h-7 min-w-[34px] px-2 text-xs font-mono font-bold border transition-colors ${
                        size === s.size
                          ? "bg-obsidian text-white border-obsidian"
                          : s.stock <= 0
                          ? "border-ink-200 text-ink-200 line-through cursor-not-allowed"
                          : "border-ink-200 text-obsidian hover:border-obsidian bg-white"
                      }`}
                    >
                      {s.size}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons Row */}
          <div className="pt-4 mt-4 border-t border-ink-100 flex flex-wrap items-center gap-3">
            {!soldOut ? (
              <button
                disabled={adding}
                onClick={handleAdd}
                data-testid={`product-card-add-btn-${product.id}`}
                className="bg-obsidian text-white font-display tracking-wider text-xs sm:text-sm font-bold py-2.5 px-6 rounded-none flex items-center justify-center gap-2 hover:bg-fire transition-colors active:scale-[0.99] disabled:opacity-70 disabled:cursor-wait shadow-sm"
              >
                {adding ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Adding...
                  </>
                ) : added ? (
                  <>
                    <Check size={16} /> Added to Bag
                  </>
                ) : (
                  <>
                    <Plus size={16} /> Quick Add
                  </>
                )}
              </button>
            ) : (
              <button
                disabled
                className="bg-ink-200 text-ink-500 font-display text-xs sm:text-sm py-2.5 px-6 rounded-none cursor-not-allowed font-bold"
              >
                Sold Out
              </button>
            )}

            {onQuickView && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onQuickView(product);
                }}
                className="border border-ink-200 bg-white hover:border-obsidian hover:bg-obsidian hover:text-white font-mono text-xs font-bold py-2.5 px-4 transition-colors flex items-center gap-1.5"
              >
                <Eye size={14} />
                <span>Quick View</span>
              </button>
            )}

            <button
              disabled={togglingWishlist}
              onClick={handleToggleWishlist}
              data-testid={`product-card-wishlist-btn-${product.id}`}
              className="h-10 w-10 grid place-items-center border border-ink-200 bg-white hover:border-obsidian transition-colors disabled:opacity-70 disabled:cursor-wait ml-auto sm:ml-0"
              title="Add to wishlist"
              aria-label="Wishlist"
            >
              {togglingWishlist ? (
                <Loader2 size={16} className="animate-spin text-obsidian" />
              ) : (
                <motion.span animate={inWish ? { scale: [1, 1.35, 1] } : {}} transition={{ duration: 0.35 }}>
                  <Heart size={16} className={inWish ? "fill-fire text-fire" : "text-obsidian"} />
                </motion.span>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // 📦 Standard Grid Card Layout
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: (index % 4) * 0.06 }}
      className="group relative"
      data-testid={`product-card-${product.id}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="relative overflow-hidden rounded-none border border-ink-200 group-hover:border-obsidian transition-colors duration-300 bg-ink-100 aspect-square">
        <Link to={`/products/${product.slug}`}>
          <motion.img
            src={img}
            alt={product.name}
            data-testid={`product-card-image-${product.id}`}
            className="absolute inset-0 h-full w-full object-cover"
            animate={{ opacity: hover ? 0 : 1, scale: hover ? 1.05 : 1 }}
            transition={{ duration: 0.5 }}
            loading="lazy"
          />
          <motion.img
            src={hoverImg}
            alt={product.name}
            className="absolute inset-0 h-full w-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: hover ? 1 : 0, scale: hover ? 1.05 : 1 }}
            transition={{ duration: 0.5 }}
            loading="lazy"
          />
        </Link>

        {/* badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {pct > 0 && (
            <span
              data-testid={`product-card-badge-${product.id}`}
              className="bg-fire text-white font-mono text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-none tracking-wider shadow-sm"
            >
              -{pct}%
            </span>
          )}
          {product.is_new_arrival && (
            <span className="bg-obsidian text-white font-mono text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-none tracking-wider shadow-sm">
              NEW
            </span>
          )}
          {lowStock && !pct && (
            <span className="bg-amber-600 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-none tracking-wider shadow-sm">
              FEW LEFT
            </span>
          )}
        </div>

        {/* actions: wishlist + quick view */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-10">
          <button
            disabled={togglingWishlist}
            onClick={handleToggleWishlist}
            data-testid={`product-card-wishlist-btn-${product.id}`}
            className="h-8 w-8 sm:h-9 sm:w-9 grid place-items-center rounded-none bg-white/95 border border-ink-200 hover:border-obsidian hover:bg-white transition-colors duration-200 shadow-sm disabled:opacity-70 disabled:cursor-wait"
            aria-label="wishlist"
          >
            {togglingWishlist ? (
              <Loader2 size={16} className="animate-spin text-obsidian" />
            ) : (
              <motion.span animate={inWish ? { scale: [1, 1.35, 1] } : {}} transition={{ duration: 0.35 }}>
                <Heart size={16} className={inWish ? "fill-fire text-fire" : "text-obsidian"} />
              </motion.span>
            )}
          </button>

          {onQuickView && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView(product);
              }}
              className="h-8 w-8 sm:h-9 sm:w-9 hidden group-hover:grid place-items-center rounded-none bg-white/95 border border-ink-200 hover:border-obsidian hover:bg-obsidian hover:text-white transition-all duration-200 shadow-sm"
              title="Quick View"
              aria-label="Quick View"
            >
              <Eye size={15} />
            </button>
          )}
        </div>

        {soldOut && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] grid place-items-center z-10">
            <span className="font-display tracking-widest text-obsidian border-2 border-obsidian px-4 py-2">
              Sold Out
            </span>
          </div>
        )}

        {/* size chips + add */}
        {!soldOut && (
          <AnimatePresence>
            {hover && (
              <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="absolute bottom-0 inset-x-0 p-2.5 bg-white/95 backdrop-blur-sm border-t border-ink-200 hidden lg:block z-10"
              >
                <div className="flex flex-wrap gap-1.5 justify-center mb-2">
                  {(product.sizes || []).map((s) => (
                    <button
                      key={s.size}
                      disabled={s.stock <= 0}
                      onClick={() => setSize(s.size)}
                      data-testid={`product-card-size-${s.size}-${product.id}`}
                      className={`h-7 min-w-[30px] px-1 rounded-none border text-xs font-mono font-bold transition-colors duration-150 ${
                        size === s.size
                          ? "bg-obsidian text-white border-obsidian"
                          : s.stock <= 0
                          ? "border-ink-200 text-ink-200 line-through cursor-not-allowed"
                          : "border-ink-200 text-obsidian hover:border-obsidian"
                      }`}
                    >
                      {s.size}
                    </button>
                  ))}
                </div>
                <button
                  disabled={adding}
                  onClick={handleAdd}
                  data-testid={`product-card-add-btn-${product.id}`}
                  className="w-full bg-obsidian text-white font-display tracking-wider text-sm py-2.5 rounded-none flex items-center justify-center gap-2 hover:bg-fire transition-colors duration-200 active:scale-[0.99] disabled:opacity-70 disabled:cursor-wait"
                >
                  {adding ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Adding...
                    </>
                  ) : added ? (
                    <>
                      <Check size={16} /> Added
                    </>
                  ) : (
                    <>
                      <Plus size={16} /> Quick Add
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* info */}
      <div className="pt-3 px-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] tracking-[0.2em] text-ink-400 truncate">
            {product.brand_slug?.replace("-", " ")}
          </span>
          <Stars rating={product.avg_rating} count={product.review_count} size={12} />
        </div>
        <Link to={`/products/${product.slug}`}>
          <h3
            data-testid={`product-card-title-${product.id}`}
            className="font-display font-bold text-sm sm:text-base tracking-tight mt-1 leading-snug line-clamp-1 text-obsidian hover:text-fire transition-colors"
          >
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-2 mt-1.5">
          <span
            data-testid={`product-card-price-${product.id}`}
            className="font-mono font-bold text-obsidian"
          >
            {fmt(product.base_price)}
          </span>
          {pct > 0 && (
            <span
              data-testid={`product-card-original-price-${product.id}`}
              className="font-mono text-sm text-ink-400 line-through"
            >
              {fmt(product.compare_at_price)}
            </span>
          )}
        </div>
        {!soldOut && (
          <div className="lg:hidden mt-2.5 flex flex-wrap gap-1">
            {(product.sizes || []).map((s) => (
              <button
                key={s.size}
                disabled={s.stock <= 0}
                onClick={() => setSize(s.size)}
                data-testid={`product-card-msize-${s.size}-${product.id}`}
                className={`h-7 min-w-[30px] px-1 border text-[11px] font-mono font-bold transition-colors ${
                  size === s.size
                    ? "bg-obsidian text-white border-obsidian"
                    : s.stock <= 0
                    ? "border-ink-200 text-ink-200 line-through"
                    : "border-ink-200 text-obsidian"
                }`}
              >
                {s.size}
              </button>
            ))}
          </div>
        )}
        {!soldOut && (
          <button
            disabled={adding}
            onClick={handleAdd}
            data-testid={`product-card-mobile-add-${product.id}`}
            className="lg:hidden mt-2 w-full bg-obsidian text-white font-display tracking-wider text-xs py-2.5 flex items-center justify-center gap-1.5 active:scale-[0.99] disabled:opacity-70 disabled:cursor-wait"
          >
            {adding ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Adding...
              </>
            ) : added ? (
              <>
                <Check size={14} /> Added
              </>
            ) : (
              <>
                <Plus size={14} /> Quick Add
              </>
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}
