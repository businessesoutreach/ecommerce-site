import React, { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { http } from "../lib/api";
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
  const loc = useLocation();
  const [sp] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("featured");
  const [size, setSize] = useState(sp.get("size") || "");
  const [brand, setBrand] = useState("");
  const [brands, setBrands] = useState([]);
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const title = mode === "new" ? "New Arrivals" : mode === "flash" ? "Flash Sale" : mode === "search" ? `Search: "${sp.get("q") || ""}"` : category?.name || "Collection";

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (mode === "new") params.set("flag", "new");
    else if (mode === "flash") params.set("flag", "flash");
    else if (mode === "search") params.set("search", sp.get("q") || "");
    else if (slug) params.set("category", slug);
    if (size) params.set("size", size);
    if (brand) params.set("brand", brand);
    if (maxPrice) params.set("max_price", maxPrice);
    params.set("sort", sort);
    params.set("limit", "48");
    const { data } = await http.get(`/products?${params}`);
    setProducts(data.data);
    setLoading(false);
  }, [mode, slug, size, brand, maxPrice, sort, sp]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    if (slug && !mode) http.get(`/categories/${slug}`).then(({ data }) => setCategory(data.data)).catch(() => {});
    http.get("/brands").then(({ data }) => setBrands(data.data));
  }, [slug, mode]);
  useEffect(() => { setSize(sp.get("size") || ""); }, [loc.key]);

  const banner = category?.banner_url;

  const Filters = () => (
    <div className="space-y-8">
      <div>
        <h4 className="font-display font-bold uppercase text-sm tracking-wide mb-3">Size</h4>
        <div className="grid grid-cols-4 gap-2">
          {SIZES.map((s) => (
            <button key={s} onClick={() => setSize(size === s ? "" : s)} className={`py-2 rounded-none font-mono text-sm font-bold border transition-colors ${size === s ? "bg-obsidian text-white border-obsidian" : "border-ink-200 hover:border-obsidian"}`}>{s}</button>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-display font-bold uppercase text-sm tracking-wide mb-3">Brand</h4>
        <div className="space-y-2">
          {brands.map((b) => (
            <label key={b.id} className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="radio" name="brand" checked={brand === b.slug} onChange={() => setBrand(brand === b.slug ? "" : b.slug)} className="accent-fire" />
              {b.name}
            </label>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-display font-bold uppercase text-sm tracking-wide mb-3">Max Price</h4>
        <input type="range" min="3000" max="18000" step="500" value={maxPrice || 18000} onChange={(e) => setMaxPrice(e.target.value)} className="w-full accent-fire" />
        <p className="font-mono text-sm mt-1">Up to Rs. {Number(maxPrice || 18000).toLocaleString()}</p>
      </div>
      <button onClick={() => { setSize(""); setBrand(""); setMaxPrice(""); }} className="text-fire font-bold text-sm underline underline-offset-4">Clear all filters</button>
    </div>
  );

  return (
    <div>
      {/* banner */}
      <div className="relative h-52 sm:h-64 bg-obsidian overflow-hidden">
        {banner && <img src={banner} alt={title} className="absolute inset-0 h-full w-full object-cover opacity-50" />}
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian to-transparent" />
        <div className="relative max-w-[1400px] mx-auto px-5 sm:px-8 h-full flex flex-col justify-end pb-8">
          <h1 className="font-display text-white text-4xl sm:text-6xl font-black uppercase tracking-tight">{title}</h1>
          {category?.tagline && <p className="text-white/60 mt-1">{category.tagline}</p>}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 py-8 flex gap-8">
        <aside className="hidden lg:block w-64 shrink-0">
          <Filters />
        </aside>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <span className="text-ink-500 text-sm font-mono">{loading ? "…" : products.length} products</span>
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
                <h3 className="font-display font-black text-xl uppercase">Filters</h3>
                <button onClick={() => setShowFilters(false)}><X size={22} /></button>
              </div>
              <Filters />
              <button onClick={() => setShowFilters(false)} className="w-full bg-obsidian text-white font-display font-bold uppercase py-4 rounded-none mt-8">Show {products.length} results</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
