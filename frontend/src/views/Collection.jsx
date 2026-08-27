import React, { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { http } from "../lib/api";
import { useStore } from "../context/StoreContext";
import ProductCard from "../components/ProductCard";
import { ProductCardSkeleton, EmptyState } from "../components/common";
import { Package } from "lucide-react";

const SIZES = ["39", "40", "41", "42", "43", "44", "45", "46"];
const SORTS = [
  { v: "featured", l: "Featured" },
  { v: "newest", l: "Newest" },
  { v: "price_asc", l: "Price: Low to High" },
  { v: "price_desc", l: "Price: High to Low" },
  { v: "rating", l: "Top Rated" },
];

export default function Collection({ mode }) {
  const { slug } = useParams();
  const { settings } = useStore();
  const loc = useLocation();
  const [sp] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("featured");
  const [size, setSize] = useState(sp.get("size") || "");
  const [brand, setBrand] = useState(sp.get("brand") ? sp.get("brand").split(",").filter(Boolean) : []);
  const [brands, setBrands] = useState([]);
  const [catFilter, setCatFilter] = useState(sp.get("category") ? sp.get("category").split(",").filter(Boolean) : []);
  const [categories, setCategories] = useState([]);
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const title = mode === "all" ? "All Kicks" : mode === "new" ? "New Arrivals" : mode === "flash" ? "Flash Sale" : mode === "search" ? `Search: "${sp.get("q") || ""}"` : category?.name || "Collection";

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (mode === "new") params.set("flag", "new");
    else if (mode === "flash") params.set("flag", "flash");
    else if (mode === "search") params.set("search", sp.get("q") || "");
    else if (slug) params.set("category", slug);
    else if (catFilter.length > 0) params.set("category", catFilter.join(","));
    if (size) params.set("size", size);
    if (brand.length > 0) params.set("brand", brand.join(","));
    if (maxPrice) params.set("max_price", maxPrice);
    params.set("sort", sort);
    params.set("limit", "48");
    const { data } = await http.get(`/products?${params}`);
    setProducts(data.data);
    setLoading(false);
  }, [mode, slug, size, brand, catFilter, maxPrice, sort, sp]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    if (slug && !mode) http.get(`/categories/${slug}`).then(({ data }) => setCategory(data.data)).catch(() => {});
    if (!slug) http.get("/categories").then(({ data }) => setCategories(data.data)).catch(() => {});
    http.get("/brands").then(({ data }) => setBrands(data.data)).catch(() => {});
  }, [slug, mode]);

  useEffect(() => { 
    if (!sp) return;
    setSize(sp.get("size") || "");
    const b = sp.get("brand");
    const c = sp.get("category");
    setBrand(b ? b.split(",").filter(Boolean) : []);
    setCatFilter(c ? c.split(",").filter(Boolean) : []);
    setMaxPrice("");
    setCategory(null);
  }, [loc.pathname, sp]);

  const banner = category?.hero_banner_url || category?.image_url || "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=1400&q=80";
  const video = category?.hero_video_url;

  const renderFilters = () => (
    <div className="space-y-8">
      {!slug && categories.length > 0 && (
        <div>
          <h4 className="font-display text-sm tracking-wide mb-3">Category</h4>
          <div className="space-y-2">
            {categories.map((c) => (
              <label key={c.id} className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" name="category" checked={catFilter.includes(c.slug)} onChange={() => setCatFilter(prev => prev.includes(c.slug) ? prev.filter(x => x !== c.slug) : [...prev, c.slug])} className="accent-fire" />
                {c.name}
              </label>
            ))}
          </div>
        </div>
      )}
      <div>
        <h4 className="font-display text-sm tracking-wide mb-3">Size</h4>
        <div className="grid grid-cols-4 gap-2">
          {SIZES.map((s) => (
            <button key={s} onClick={() => setSize(size === s ? "" : s)} className={`py-2 rounded-none font-mono text-sm font-bold border transition-colors ${size === s ? "bg-obsidian text-white border-obsidian" : "border-ink-200 hover:border-obsidian"}`}>{s}</button>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-display text-sm tracking-wide mb-3">Brand</h4>
        <div className="space-y-2">
          {brands.map((b) => (
            <label key={b.id} className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" name="brand" checked={brand.includes(b.slug)} onChange={() => setBrand(prev => prev.includes(b.slug) ? prev.filter(x => x !== b.slug) : [...prev, b.slug])} className="accent-fire" />
              {b.name}
            </label>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-display text-sm tracking-wide mb-3">Max Price</h4>
        <input type="range" min="3000" max="18000" step="500" value={maxPrice || 18000} onChange={(e) => setMaxPrice(e.target.value)} className="w-full accent-fire" />
        <p className="font-mono text-sm mt-1">Up to Rs. {Number(maxPrice || 18000).toLocaleString()}</p>
      </div>
      <button onClick={() => { setSize(""); setBrand([]); setMaxPrice(""); setCatFilter([]); }} className="text-fire font-bold text-sm underline underline-offset-4">Clear all filters</button>
    </div>
  );

  const isFlashEnded = mode === "flash" && (!settings?.flash_sale_active || !settings?.flash_sale_end_time || new Date(settings.flash_sale_end_time) < new Date());

  return (
    <div>
      {/* premium text header */}
      <div className="relative bg-obsidian text-white py-10 sm:py-14 overflow-hidden">
        {/* Animated background decorations */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-fire/40 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none animate-float" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/30 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/4 pointer-events-none animate-float" style={{ animationDelay: "2s" }} />
        
        {/* Glow directly behind text */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50%] h-[70%] bg-white/10 rounded-full blur-[50px] pointer-events-none animate-pulse" />

        <div className="relative max-w-[1400px] mx-auto px-5 sm:px-8 text-center flex flex-col items-center">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight capitalize drop-shadow-2xl bg-gradient-to-r from-white via-fire to-white text-transparent bg-clip-text animate-gradient-x">
            {title ? title.toLowerCase() : ""}
          </h1>
          {category?.tagline && (
            <p className="text-white/70 mt-3 text-sm sm:text-base max-w-xl mx-auto font-light leading-relaxed drop-shadow-md">
              {category.tagline}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 py-8 flex gap-8">
        <aside className="hidden lg:block w-64 shrink-0 pb-10">
          {renderFilters()}
        </aside>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <span className="text-ink-500 text-sm font-mono">{loading ? "…" : isFlashEnded ? "0" : products.length} products</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowFilters(true)} className="lg:hidden flex items-center gap-2 border border-ink-200 rounded-none px-4 py-2 text-sm font-bold" data-testid="mobile-filters-btn"><SlidersHorizontal size={15} /> Filter</button>
              <div className="relative">
                <select value={sort} onChange={(e) => setSort(e.target.value)} data-testid="sort-select" className="appearance-none border border-ink-200 rounded-none pl-4 pr-9 py-2 text-sm font-bold bg-white cursor-pointer">
                  {SORTS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
                </select>
                <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">{Array.from({ length: 9 }).map((_, i) => <ProductCardSkeleton key={i} />)}</div>
          ) : isFlashEnded ? (
            <EmptyState icon={Package} title="Flash Sale Ended" subtitle="There are no active flash sales right now. Check back later!" />
          ) : products.length === 0 ? (
            <EmptyState icon={Package} title="No kicks match" subtitle="Try adjusting your filters or explore another category." />
          ) : (
            <motion.div layout className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </motion.div>
          )}
        </div>
      </div>

      {/* Mobile filter sheet */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-obsidian/60 z-50" onClick={() => setShowFilters(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 260 }} className="fixed bottom-0 inset-x-0 max-h-[85vh] overflow-y-auto bg-canvas z-50 rounded-none p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display">Filters</h3>
                <button onClick={() => setShowFilters(false)}><X size={22} /></button>
              </div>
              {renderFilters()}
              <button onClick={() => setShowFilters(false)} className="w-full bg-obsidian text-white font-display py-4 rounded-none mt-8">Show {products.length} results</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

