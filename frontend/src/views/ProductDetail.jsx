import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag, Truck, RefreshCw, ShieldCheck, Ruler, ChevronRight, Zap, Loader2 } from "lucide-react";
import { http, fmt, discountPct } from "../lib/api";
import { useStore } from "../context/StoreContext";
import ProductCard from "../components/ProductCard";
import { Stars, ScrollReveal, SectionHeader } from "../components/common";
import { toast } from "sonner";
import ReviewModal from "../components/ReviewModal";

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
  const [addingToCart, setAddingToCart] = useState(false);
  const [togglingWishlist, setTogglingWishlist] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

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

  const handleAddToCart = async () => {
    if (!size) return toast.error("Select a size");
    setAddingToCart(true);
    await addToCart(p.id, size, 1);
    setAddingToCart(false);
  };

  const handleToggleWishlist = async () => {
    setTogglingWishlist(true);
    await toggleWishlist(p.id);
    setTogglingWishlist(false);
  };

  return (
    <div className="pb-28 lg:pb-0">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 pt-5">
        <nav className="flex items-center gap-1.5 text-xs text-ink-400 font-mono  tracking-wide">
          <Link to="/" className="hover:text-obsidian">Home</Link><ChevronRight size={12} />
          <Link to={`/collections/${p.category_slug}`} className="hover:text-obsidian">{p.category_slug}</Link><ChevronRight size={12} />
          <span className="text-obsidian truncate">{p.name}</span>
        </nav>
      </div>

      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 py-6 grid lg:grid-cols-2 gap-8 lg:gap-14">
        {/* gallery */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="relative overflow-hidden rounded-none bg-ink-100 aspect-square group flex items-center justify-center">
            <AnimatePresence mode="wait">
              {activeImg === 2 ? (
                <motion.div
                  key="3d-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full relative flex items-center justify-center"
                >
                  <motion.img
                    src={images[2]}
                    alt={`${p.name} 3D View`}
                    className="w-[85%] h-[85%] object-contain drop-shadow-[0_20px_20px_rgba(0,0,0,0.25)] z-10"
                    animate={{ y: [0, -20, 0], rotateX: [0, 5, 0], rotateY: [-5, 5, -5] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  />
                  {/* Fake floor shadow that shrinks when the shoe floats up */}
                  <motion.div
                    className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-[60%] h-[20px] bg-black/20 rounded-[100%] blur-md"
                    animate={{ scale: [1, 0.7, 1], opacity: [0.6, 0.3, 0.6] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  />
                </motion.div>
              ) : (
                <motion.img 
                  key={activeImg} 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }} 
                  src={images[activeImg]} 
                  alt={p.name} 
                  data-testid="pdp-main-image" 
                  className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" 
                />
              )}
            </AnimatePresence>
            {pct > 0 && <span className="absolute top-4 left-4 bg-fire text-white font-mono font-bold px-3 py-1.5 rounded-none z-20">-{pct}%</span>}
          </div>
          <div className="flex gap-3 mt-3">
            {images.map((im, i) => (
              <button key={i} onClick={() => setActiveImg(i)} data-testid={`pdp-thumbnail-${i}`} className={`relative h-20 w-20 rounded-none overflow-hidden border-2 transition-all ${activeImg === i ? "border-fire" : "border-transparent"}`}>
                <img src={im} alt="" className="h-full w-full object-cover" />
                {i === 2 && (
                  <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-[9px] font-bold text-center py-0.5  tracking-widest backdrop-blur-sm">
                    3D View
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* info */}
        <div>
          <span className="font-mono text-[11px]  tracking-[0.2em] text-ink-400">{p.brand_slug?.replace("-", " ")}</span>
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
            <button disabled={addingToCart} onClick={handleAddToCart} data-testid="pdp-add-to-cart-btn" className="flex-1 bg-obsidian text-white font-display tracking-wider py-4 rounded-none flex items-center justify-center gap-2 hover:bg-fire transition-colors active:scale-[0.99] disabled:opacity-70 disabled:cursor-wait">
              {addingToCart ? <Loader2 size={18} className="animate-spin" /> : <ShoppingBag size={18} />} 
              {addingToCart ? "Adding..." : "Add to Bag"}
            </button>
            <button disabled={togglingWishlist} onClick={handleToggleWishlist} data-testid="pdp-wishlist-toggle" className="h-[56px] w-[56px] grid place-items-center rounded-none border-2 border-obsidian hover:bg-obsidian hover:text-white transition-colors disabled:opacity-70 disabled:cursor-wait">
              {togglingWishlist ? <Loader2 size={20} className="animate-spin" /> : <Heart size={20} className={inWish ? "fill-fire text-fire" : ""} />}
            </button>
          </div>

          {/* trust mini */}
          <div className="grid grid-cols-3 gap-3 mt-8">
            {[[Truck, "Fast COD Delivery"], [RefreshCw, "7-Day Exchange"], [ShieldCheck, "Authentic Grade"]].map(([I, t]) => (
              <div key={t} className="flex flex-col items-center text-center gap-1.5 border border-ink-200 rounded-none py-4"><I size={18} className="text-fire" /><span className="text-[11px] font-bold  tracking-tight">{t}</span></div>
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
                  <div className="flex justify-between items-center mb-6 border-b border-ink-100 pb-4">
                    <div>
                      <h3 className="font-display font-bold text-lg">Customer Reviews</h3>
                      <p className="text-sm text-ink-400">Based on {reviews.length} reviews</p>
                    </div>
                    <button 
                      onClick={() => setReviewModalOpen(true)}
                      className="bg-obsidian text-white px-4 py-2 text-sm font-bold font-display hover:bg-fire transition-colors"
                    >
                      Write a Review
                    </button>
                  </div>
                  
                  {reviews.length === 0 ? <p className="text-ink-400">No reviews yet. Be the first to review.</p> : reviews.map((r) => (
                    <div key={r.id} className="border-b border-ink-200 pb-4">
                      <div className="flex items-center justify-between"><span className="font-display font-bold text-sm">{r.customer_name}</span><Stars rating={r.rating} size={13} /></div>
                      {r.comment && <p className="text-ink-500 text-sm mt-1.5">{r.comment}</p>}
                      {r.image_urls && r.image_urls.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {r.image_urls.map((img, i) => (
                            <a href={img} target="_blank" rel="noreferrer" key={i}>
                              <img src={img} alt="Review" className="h-20 w-20 object-cover border border-ink-200" />
                            </a>
                          ))}
                        </div>
                      )}
                      {r.admin_reply && (
                        <div className="mt-3 bg-ink-50 p-3 border-l-2 border-fire">
                          <p className="text-xs font-bold text-obsidian mb-1">Response from Solekicks</p>
                          <p className="text-sm text-ink-500">{r.admin_reply}</p>
                        </div>
                      )}
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
        <button disabled={togglingWishlist} onClick={handleToggleWishlist} className="h-12 w-12 grid place-items-center rounded-none border-2 border-obsidian shrink-0 disabled:opacity-70 disabled:cursor-wait">
          {togglingWishlist ? <Loader2 size={18} className="animate-spin" /> : <Heart size={18} className={inWish ? "fill-fire text-fire" : ""} />}
        </button>
        <button disabled={addingToCart} onClick={handleAddToCart} data-testid="pdp-add-to-cart-btn-mobile" className="flex-1 bg-obsidian text-white font-display tracking-wider rounded-none flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait">
          {addingToCart ? <Loader2 size={17} className="animate-spin" /> : <ShoppingBag size={17} />} 
          {addingToCart ? "Adding..." : `Add to Bag · ${fmt(p.base_price)}`}
        </button>
      </div>

      <ReviewModal 
        open={reviewModalOpen} 
        onClose={() => setReviewModalOpen(false)} 
        product={p} 
        onReviewSubmitted={async () => {
          const rev = await http.get(`/products/${p.id}/reviews`);
          setReviews(rev.data.data);
        }} 
      />
    </div>
  );
}

