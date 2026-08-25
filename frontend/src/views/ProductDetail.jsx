import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag, Truck, RefreshCw, ShieldCheck, Ruler, ChevronRight, Zap } from "lucide-react";
import { http, fmt, discountPct } from "../lib/api";
import { useStore } from "../context/StoreContext";
import ProductCard from "../components/ProductCard";
import { Stars, ScrollReveal, SectionHeader } from "../components/common";
import { toast } from "sonner";

export default function ProductDetail() {
  const { slug } = useParams();
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const [p, setP] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [size, setSize] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [tab, setTab] = useState("details");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    (async () => {
      const { data } = await http.get(`/products/${slug}`);
      setP(data.data);
      setActiveImg(0);
      setSize(null);
      const [rel, rev] = await Promise.all([
        http.get(`/products/${data.data.id}/related`),
        http.get(`/products/${data.data.id}/reviews`),
      ]);
      setRelated(rel.data.data);
      setReviews(rev.data.data);
      setLoading(false);
    })();
  }, [slug]);

  if (loading || !p) return <div className="max-w-[1400px] mx-auto px-5 sm:px-8 py-10 grid lg:grid-cols-2 gap-10"><div className="skeleton aspect-square rounded-none" /><div className="space-y-4"><div className="skeleton h-8 w-3/4 rounded" /><div className="skeleton h-6 w-1/3 rounded" /><div className="skeleton h-40 rounded" /></div></div>;

  const pct = discountPct(p.base_price, p.compare_at_price);
  const inWish = wishlist.ids.includes(p.id);
  const variant = p.sizes.find((s) => s.size === size);
  const images = p.images.filter(Boolean);

  return (
    <div className="pb-28 lg:pb-0">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 pt-5">
        <nav className="flex items-center gap-1.5 text-xs text-ink-400 font-mono uppercase tracking-wide">
          <Link to="/" className="hover:text-obsidian">Home</Link><ChevronRight size={12} />
          <Link to={`/collections/${p.category_slug}`} className="hover:text-obsidian">{p.category_slug}</Link><ChevronRight size={12} />
          <span className="text-obsidian truncate">{p.name}</span>
        </nav>
      </div>

      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 py-6 grid lg:grid-cols-2 gap-8 lg:gap-14">
        {/* gallery */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="relative overflow-hidden rounded-none bg-ink-100 aspect-square group">
            <AnimatePresence mode="wait">
              <motion.img key={activeImg} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} src={images[activeImg]} alt={p.name} data-testid="pdp-main-image" className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
            </AnimatePresence>
            {pct > 0 && <span className="absolute top-4 left-4 bg-fire text-white font-mono font-bold px-3 py-1.5 rounded-none">-{pct}%</span>}
          </div>
          <div className="flex gap-3 mt-3">
            {images.map((im, i) => (
              <button key={i} onClick={() => setActiveImg(i)} data-testid={`pdp-thumbnail-${i}`} className={`h-20 w-20 rounded-none overflow-hidden border-2 ${activeImg === i ? "border-fire" : "border-transparent"}`}>
                <img src={im} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* info */}
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-400">{p.brand_slug?.replace("-", " ")}</span>
          <h1 className="font-display tracking-tight leading-none mt-2">{p.name}</h1>
          <div className="flex items-center gap-3 mt-3"><Stars rating={p.avg_rating} count={p.review_count} /></div>
          <div className="flex items-baseline gap-3 mt-5">
            <span className="font-mono font-bold text-2xl text-fire">{fmt(p.base_price)}</span>
            {pct > 0 && <span className="font-mono text-lg text-ink-400 line-through">{fmt(p.compare_at_price)}</span>}
            {pct > 0 && <span className="bg-fire/10 text-fire font-bold text-sm px-2 py-0.5 rounded">Save {pct}%</span>}
          </div>

          {/* sizes */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-display text-sm tracking-wide">Select Size (EU)</h4>
              <span className="flex items-center gap-1 text-xs text-ink-400"><Ruler size={13} /> Size guide</span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {p.sizes.map((s) => (
                <button key={s.size} disabled={s.stock <= 0} onClick={() => setSize(s.size)} data-testid={`pdp-size-${s.size}`} className={`py-3 rounded-none font-mono font-bold border-2 transition-all ${size === s.size ? "bg-obsidian text-white border-obsidian" : s.stock <= 0 ? "border-ink-200 text-ink-200 line-through cursor-not-allowed" : "border-ink-200 hover:border-obsidian"}`}>{s.size}</button>
              ))}
            </div>
            {variant && variant.stock <= 3 && <p className="mt-2 text-fire text-sm font-bold flex items-center gap-1"><Zap size={14} className="fill-fire" /> Only {variant.stock} left in EU {size}!</p>}
          </div>

          {/* actions */}
          <div className="hidden lg:flex gap-3 mt-8">
            <button onClick={() => addToCart(p.id, size, 1)} data-testid="pdp-add-to-cart-btn" className="flex-1 bg-obsidian text-white font-display tracking-wider py-4 rounded-none flex items-center justify-center gap-2 hover:bg-fire transition-colors active:scale-[0.99]">
              <ShoppingBag size={18} /> Add to Bag
            </button>
            <button onClick={() => toggleWishlist(p.id)} data-testid="pdp-wishlist-toggle" className="h-[56px] w-[56px] grid place-items-center rounded-none border-2 border-obsidian hover:bg-obsidian hover:text-white transition-colors">
              <Heart size={20} className={inWish ? "fill-fire text-fire" : ""} />
            </button>
          </div>

          {/* trust mini */}
          <div className="grid grid-cols-3 gap-3 mt-8">
            {[[Truck, "Fast COD Delivery"], [RefreshCw, "7-Day Exchange"], [ShieldCheck, "Authentic Grade"]].map(([I, t]) => (
              <div key={t} className="flex flex-col items-center text-center gap-1.5 border border-ink-200 rounded-none py-4"><I size={18} className="text-fire" /><span className="text-[11px] font-bold uppercase tracking-tight">{t}</span></div>
            ))}
          </div>

          {/* tabs */}
          <div className="mt-10 border-t border-ink-200 pt-6">
            <div className="flex gap-6 border-b border-ink-200">
              {[["details", "Details"], ["reviews", `Reviews (${reviews.length})`]].map(([k, l]) => (
                <button key={k} onClick={() => setTab(k)} className="relative pb-3 font-display text-sm tracking-wide">
                  {l}
                  {tab === k && <motion.span layoutId="tab" className="absolute -bottom-px left-0 right-0 h-[2px] bg-fire" />}
                </button>
              ))}
            </div>
            <div className="py-5">
              {tab === "details" ? (
                <p className="text-ink-500 leading-relaxed">{p.description}</p>
              ) : (
                <div className="space-y-5" data-testid="pdp-reviews-section">
                  {reviews.length === 0 ? <p className="text-ink-400">No reviews yet. Be the first to review.</p> : reviews.map((r) => (
                    <div key={r.id} className="border-b border-ink-200 pb-4">
                      <div className="flex items-center justify-between"><span className="font-display font-bold text-sm">{r.customer_name}</span><Stars rating={r.rating} size={13} /></div>
                      {r.comment && <p className="text-ink-500 text-sm mt-1.5">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* related */}
      {related.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-5 sm:px-8 py-10">
          <ScrollReveal><SectionHeader eyebrow="You may also like" title="Complete The Rotation" /></ScrollReveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">{related.slice(0, 4).map((rp, i) => <ProductCard key={rp.id} product={rp} index={i} />)}</div>
        </section>
      )}

      {/* sticky mobile buy bar */}
      <div className="lg:hidden fixed bottom-[68px] inset-x-0 z-30 bg-white border-t border-ink-200 p-3 flex gap-2">
        <button onClick={() => toggleWishlist(p.id)} className="h-12 w-12 grid place-items-center rounded-none border-2 border-obsidian shrink-0"><Heart size={18} className={inWish ? "fill-fire text-fire" : ""} /></button>
        <button onClick={() => { if (!size) return toast.error("Select a size"); addToCart(p.id, size, 1); }} data-testid="pdp-add-to-cart-btn-mobile" className="flex-1 bg-obsidian text-white font-display tracking-wider rounded-none flex items-center justify-center gap-2">
          <ShoppingBag size={17} /> Add to Bag · {fmt(p.base_price)}
        </button>
      </div>
    </div>
  );
}
