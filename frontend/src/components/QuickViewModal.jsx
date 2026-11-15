import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Heart, Check, Loader2, ArrowRight, Truck, RefreshCw, ShieldCheck, Zap } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { fmt, discountPct } from "../lib/api";
import { Stars } from "./common";
import { toast } from "sonner";

export default function QuickViewModal({ product, isOpen, onClose }) {
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const [selectedSize, setSelectedSize] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [togglingWishlist, setTogglingWishlist] = useState(false);

  useEffect(() => {
    if (product) {
      setSelectedSize(null);
      setActiveImage(0);
      setAdded(false);
      // Auto select first available size
      const firstAvailable = (product.sizes || []).find((s) => s.stock > 0)?.size;
      if (firstAvailable) setSelectedSize(firstAvailable);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const pct = discountPct(product.base_price, product.compare_at_price);
  const inWish = wishlist.ids.includes(product.id);
  const images = (product.images || []).filter(Boolean);
  if (images.length === 0 && product.image_url) images.push(product.image_url);
  const variant = (product.sizes || []).find((s) => s.size === selectedSize);
  const soldOut = (product.sizes || []).every((s) => s.stock <= 0);

  const handleAddToCart = async () => {
    if (!selectedSize) {
      toast.error("Please select an EU size first");
      return;
    }
    setAdding(true);
    await addToCart(product.id, selectedSize, 1);
    setAdding(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWishlist = async () => {
    setTogglingWishlist(true);
    await toggleWishlist(product.id);
    setTogglingWishlist(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-obsidian/75 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-4xl bg-white border border-ink-200 shadow-2xl overflow-hidden z-10 my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 h-9 w-9 grid place-items-center bg-white/90 border border-ink-200 hover:border-obsidian hover:bg-obsidian hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>

          <div className="grid md:grid-cols-2 max-h-[85vh] overflow-y-auto">
            {/* Gallery Column */}
            <div className="bg-ink-100 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-ink-200">
              <div className="relative aspect-square w-full overflow-hidden bg-white border border-ink-200 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeImage}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    src={images[activeImage] || images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </AnimatePresence>

                {pct > 0 && (
                  <span className="absolute top-3 left-3 bg-fire text-white font-mono text-xs font-bold px-2.5 py-1 tracking-wider">
                    -{pct}% OFF
                  </span>
                )}
                {product.is_new_arrival && (
                  <span className="absolute top-3 right-3 bg-obsidian text-white font-mono text-xs font-bold px-2.5 py-1 tracking-wider">
                    NEW
                  </span>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2.5 mt-4 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`relative h-16 w-16 shrink-0 border-2 overflow-hidden transition-all bg-white ${
                        activeImage === idx ? "border-fire shadow-sm" : "border-ink-200 hover:border-obsidian"
                      }`}
                    >
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Trust micro-badges */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-ink-200/80 text-center text-[10px] font-mono text-ink-500">
                <div className="flex flex-col items-center gap-1">
                  <Truck size={14} className="text-fire" />
                  <span>Nationwide COD</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <RefreshCw size={14} className="text-fire" />
                  <span>7-Day Exchange</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <ShieldCheck size={14} className="text-fire" />
                  <span>Authentic Pair</span>
                </div>
              </div>
            </div>

            {/* Info & Purchase Column */}
            <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div>
                {/* Brand & Rating */}
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs uppercase tracking-[0.2em] text-fire font-bold">
                    {product.brand_slug?.replace("-", " ") || "SoleKicks"}
                  </span>
                  <Stars rating={product.avg_rating || 5} count={product.review_count || 0} size={13} />
                </div>

                {/* Title */}
                <h3 className="font-display text-2xl font-bold tracking-tight text-obsidian mt-2 leading-snug">
                  {product.name}
                </h3>

                {/* Pricing */}
                <div className="flex items-baseline gap-3 mt-3">
                  <span className="font-mono font-bold text-2xl text-fire">
                    {fmt(product.base_price)}
                  </span>
                  {pct > 0 && (
                    <span className="font-mono text-base text-ink-400 line-through">
                      {fmt(product.compare_at_price)}
                    </span>
                  )}
                  {pct > 0 && (
                    <span className="bg-fire/10 text-fire font-bold text-xs px-2 py-0.5 rounded">
                      Save {pct}%
                    </span>
                  )}
                </div>

                {/* Description snippet */}
                {product.description && (
                  <p className="text-ink-500 text-xs sm:text-sm mt-3 line-clamp-3 leading-relaxed">
                    {product.description}
                  </p>
                )}

                {/* Size Selector */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="font-display text-xs font-bold uppercase tracking-wider text-obsidian">
                      Select Size (EU)
                    </span>
                    {selectedSize && (
                      <span className="font-mono text-xs text-ink-500">
                        Selected: <strong className="text-obsidian">EU {selectedSize}</strong>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {(product.sizes || []).map((s) => {
                      const isOutOfStock = s.stock <= 0;
                      const isSelected = selectedSize === s.size;
                      return (
                        <button
                          key={s.size}
                          disabled={isOutOfStock}
                          onClick={() => setSelectedSize(s.size)}
                          className={`py-2 text-xs font-mono font-bold border transition-all ${
                            isSelected
                              ? "bg-obsidian text-white border-obsidian shadow-sm"
                              : isOutOfStock
                              ? "border-ink-200 text-ink-300 line-through cursor-not-allowed bg-ink-100/50"
                              : "border-ink-200 text-obsidian hover:border-obsidian bg-white"
                          }`}
                        >
                          {s.size}
                        </button>
                      );
                    })}
                  </div>

                  {variant && variant.stock > 0 && variant.stock <= 3 && (
                    <p className="mt-2 text-fire text-xs font-bold flex items-center gap-1 font-mono">
                      <Zap size={13} className="fill-fire" /> Only {variant.stock} left in EU {selectedSize}!
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-4 border-t border-ink-200">
                <div className="flex gap-3">
                  <button
                    disabled={adding || soldOut}
                    onClick={handleAddToCart}
                    className="flex-1 bg-obsidian text-white font-display text-sm tracking-wider py-3.5 flex items-center justify-center gap-2 hover:bg-fire transition-colors active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {adding ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Adding to Bag...
                      </>
                    ) : added ? (
                      <>
                        <Check size={16} /> Added to Bag
                      </>
                    ) : soldOut ? (
                      "Sold Out"
                    ) : (
                      <>
                        <ShoppingBag size={16} /> Add to Bag · {fmt(product.base_price)}
                      </>
                    )}
                  </button>

                  <button
                    disabled={togglingWishlist}
                    onClick={handleWishlist}
                    className="h-[48px] w-[48px] grid place-items-center border-2 border-obsidian hover:bg-obsidian hover:text-white transition-colors shrink-0 disabled:opacity-60"
                    aria-label="Wishlist"
                  >
                    {togglingWishlist ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Heart size={18} className={inWish ? "fill-fire text-fire" : ""} />
                    )}
                  </button>
                </div>

                <Link
                  to={`/products/${product.slug}`}
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-mono font-bold text-ink-500 hover:text-fire transition-colors py-1.5"
                >
                  <span>View Complete Details, Reviews & Specs</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
