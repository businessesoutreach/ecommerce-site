import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useSearchParams, useLocation, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Package,
  Rows3,
  Grid2X2,
  Grid3X3,
  LayoutGrid,
  RotateCcw,
  Flame,
  Sliders,
  ArrowUpDown,
} from "lucide-react";
import { http } from "../lib/api";
import { useStore } from "../context/StoreContext";
import ProductCard from "../components/ProductCard";
import QuickViewModal from "../components/QuickViewModal";
import { ProductCardSkeleton, EmptyState, Countdown } from "../components/common";

const SIZES = ["39", "40", "41", "42", "43", "44", "45", "46"];
const SORTS = [
  { v: "featured", l: "Featured Kicks" },
  { v: "newest", l: "Newest Drops" },
  { v: "price_asc", l: "Price: Low to High" },
  { v: "price_desc", l: "Price: High to Low" },
  { v: "rating", l: "Top Rated" },
];

const PRICE_PRESETS = [
  { label: "All Prices", min: null, max: null },
  { label: "Under 8K", min: null, max: "8000" },
  { label: "8K - 12K", min: "8000", max: "12000" },
  { label: "12K+", min: "12000", max: null },
];

export default function Collection({ mode }) {
  const { slug } = useParams();
  const { settings } = useStore();
  const loc = useLocation();
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  // Core Data
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [sort, setSort] = useState("featured");
  const [size, setSize] = useState(sp.get("size") || "");
  const [brand, setBrand] = useState(sp.get("brand") ? sp.get("brand").split(",").filter(Boolean) : []);
  const [brands, setBrands] = useState([]);
  const [catFilter, setCatFilter] = useState(sp.get("category") ? sp.get("category").split(",").filter(Boolean) : []);
  const [categories, setCategories] = useState([]);
  const [maxPrice, setMaxPrice] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [gridCols, setGridCols] = useState(3); // 2, 3, or 4
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    sizes: true,
    brands: true,
    price: true,
    stock: true,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const title =
    mode === "all"
      ? "All Kicks"
      : mode === "new"
      ? "New Arrivals"
      : mode === "flash"
      ? "Flash Sale Drops"
      : mode === "search"
      ? `Search: "${sp.get("q") || ""}"`
      : category?.name || "Collection";

  // Fetch product data
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
    if (minPrice) params.set("min_price", minPrice);
    params.set("sort", sort);
    params.set("limit", "48");

    try {
      const { data } = await http.get(`/products?${params}`);
      setProducts(data.data || []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [mode, slug, size, brand, catFilter, maxPrice, minPrice, sort, sp]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Initial metadata fetch
  useEffect(() => {
    if (slug && !mode) {
      http.get(`/categories/${slug}`).then(({ data }) => setCategory(data.data)).catch(() => {});
    }
    http.get("/categories").then(({ data }) => setCategories(data.data || [])).catch(() => {});
    http.get("/brands").then(({ data }) => setBrands(data.data || [])).catch(() => {});
  }, [slug, mode]);

  useEffect(() => {
    if (!sp) return;
    setSize(sp.get("size") || "");
    const b = sp.get("brand");
    const c = sp.get("category");
    setBrand(b ? b.split(",").filter(Boolean) : []);
    setCatFilter(c ? c.split(",").filter(Boolean) : []);
    setMaxPrice("");
    setMinPrice("");
    setInStockOnly(false);
    setCategory(null);
  }, [loc.pathname, sp]);

  // Filter in-stock only client-side if toggled
  const displayProducts = useMemo(() => {
    if (!inStockOnly) return products;
    return products.filter((p) => (p.sizes || []).some((s) => s.stock > 0));
  }, [products, inStockOnly]);

  const activeFiltersCount =
    (size ? 1 : 0) +
    brand.length +
    catFilter.length +
    (maxPrice || minPrice ? 1 : 0) +
    (inStockOnly ? 1 : 0);

  const clearAllFilters = () => {
    setSize("");
    setBrand([]);
    setMaxPrice("");
    setMinPrice("");
    setCatFilter([]);
    setInStockOnly(false);
  };

  const handlePricePreset = (preset) => {
    setMinPrice(preset.min || "");
    setMaxPrice(preset.max || "");
  };

  const isFlashEnded =
    mode === "flash" &&
    (!settings?.flash_sale_active ||
      !settings?.flash_sale_end_time ||
      new Date(settings.flash_sale_end_time) < new Date());

  // Grid / List classes
  const gridClass =
    gridCols === "list"
      ? "flex flex-col gap-4 sm:gap-5"
      : gridCols === 2
      ? "grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6"
      : gridCols === 4
      ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5"
      : "grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6";

  // Reusable Filter Content (Used in both Desktop Sidebar and Mobile Sheet)
  const renderFilterGroups = () => (
    <div className="space-y-6">
      {/* Category Accordion */}
      {!slug && categories.length > 0 && (
        <div className="border-b border-ink-200 pb-5">
          <button
            onClick={() => toggleSection("categories")}
            className="w-full flex items-center justify-between text-left group"
          >
            <span className="font-display text-xs uppercase tracking-wider font-bold text-obsidian group-hover:text-fire transition-colors">
              Category
            </span>
            {expandedSections.categories ? (
              <ChevronUp size={16} className="text-ink-400" />
            ) : (
              <ChevronDown size={16} className="text-ink-400" />
            )}
          </button>

          <AnimatePresence>
            {expandedSections.categories && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden pt-3 space-y-2.5"
              >
                {categories.map((c) => {
                  const isChecked = catFilter.includes(c.slug);
                  return (
                    <label
                      key={c.id}
                      className="flex items-center justify-between text-sm cursor-pointer group select-none"
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() =>
                            setCatFilter((prev) =>
                              prev.includes(c.slug)
                                ? prev.filter((x) => x !== c.slug)
                                : [...prev, c.slug]
                            )
                          }
                          className="h-4 w-4 rounded-none border-ink-300 text-obsidian focus:ring-fire accent-fire cursor-pointer"
                        />
                        <span
                          className={`transition-colors ${
                            isChecked ? "font-bold text-obsidian" : "text-ink-700 group-hover:text-obsidian"
                          }`}
                        >
                          {c.name}
                        </span>
                      </div>
                      {c.product_count != null && (
                        <span className="font-mono text-xs text-ink-400">({c.product_count})</span>
                      )}
                    </label>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Size Accordion */}
      <div className="border-b border-ink-200 pb-5">
        <button
          onClick={() => toggleSection("sizes")}
          className="w-full flex items-center justify-between text-left group"
        >
          <div className="flex items-center gap-2">
            <span className="font-display text-xs uppercase tracking-wider font-bold text-obsidian group-hover:text-fire transition-colors">
              Size (EU)
            </span>
            {size && (
              <span className="bg-fire text-white text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-none">
                {size}
              </span>
            )}
          </div>
          {expandedSections.sizes ? (
            <ChevronUp size={16} className="text-ink-400" />
          ) : (
            <ChevronDown size={16} className="text-ink-400" />
          )}
        </button>

        <AnimatePresence>
          {expandedSections.sizes && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden pt-3"
            >
              <div className="grid grid-cols-4 gap-2">
                {SIZES.map((s) => {
                  const isSelected = size === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setSize(size === s ? "" : s)}
                      className={`py-2 text-xs font-mono font-bold border transition-all ${
                        isSelected
                          ? "bg-obsidian text-white border-obsidian shadow-sm scale-[1.02]"
                          : "border-ink-200 text-obsidian hover:border-obsidian bg-white"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Brand Accordion */}
      <div className="border-b border-ink-200 pb-5">
        <button
          onClick={() => toggleSection("brands")}
          className="w-full flex items-center justify-between text-left group"
        >
          <div className="flex items-center gap-2">
            <span className="font-display text-xs uppercase tracking-wider font-bold text-obsidian group-hover:text-fire transition-colors">
              Brand
            </span>
            {brand.length > 0 && (
              <span className="bg-obsidian text-white text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-none">
                {brand.length}
              </span>
            )}
          </div>
          {expandedSections.brands ? (
            <ChevronUp size={16} className="text-ink-400" />
          ) : (
            <ChevronDown size={16} className="text-ink-400" />
          )}
        </button>

        <AnimatePresence>
          {expandedSections.brands && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden pt-3 space-y-2.5"
            >
              {brands.map((b) => {
                const isChecked = brand.includes(b.slug);
                return (
                  <label
                    key={b.id}
                    className="flex items-center gap-2.5 text-sm cursor-pointer group select-none"
                  >
                    <input
                      type="checkbox"
                      name="brand"
                      checked={isChecked}
                      onChange={() =>
                        setBrand((prev) =>
                          prev.includes(b.slug)
                            ? prev.filter((x) => x !== b.slug)
                            : [...prev, b.slug]
                        )
                      }
                      className="h-4 w-4 rounded-none border-ink-300 text-obsidian focus:ring-fire accent-fire cursor-pointer"
                    />
                    <span
                      className={`transition-colors capitalize ${
                        isChecked ? "font-bold text-obsidian" : "text-ink-700 group-hover:text-obsidian"
                      }`}
                    >
                      {b.name}
                    </span>
                  </label>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Price Range Accordion */}
      <div className="border-b border-ink-200 pb-5">
        <button
          onClick={() => toggleSection("price")}
          className="w-full flex items-center justify-between text-left group"
        >
          <span className="font-display text-xs uppercase tracking-wider font-bold text-obsidian group-hover:text-fire transition-colors">
            Price Range
          </span>
          {expandedSections.price ? (
            <ChevronUp size={16} className="text-ink-400" />
          ) : (
            <ChevronDown size={16} className="text-ink-400" />
          )}
        </button>

        <AnimatePresence>
          {expandedSections.price && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden pt-3 space-y-3"
            >
              {/* Presets */}
              <div className="flex flex-wrap gap-1.5">
                {PRICE_PRESETS.map((p, i) => {
                  const isActive =
                    (p.max === maxPrice && (p.min || "") === minPrice) ||
                    (!p.max && !p.min && !maxPrice && !minPrice);
                  return (
                    <button
                      key={i}
                      onClick={() => handlePricePreset(p)}
                      className={`text-[11px] font-mono px-2.5 py-1 border transition-all ${
                        isActive
                          ? "bg-obsidian text-white border-obsidian font-bold"
                          : "border-ink-200 text-ink-700 hover:border-obsidian bg-white"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>

              {/* Slider */}
              <div className="pt-2">
                <input
                  type="range"
                  min="3000"
                  max="20000"
                  step="500"
                  value={maxPrice || 20000}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full accent-fire cursor-pointer"
                />
                <div className="flex items-center justify-between font-mono text-xs text-ink-500 mt-1">
                  <span>Rs. 3,000</span>
                  <span className="font-bold text-obsidian">
                    Up to Rs. {Number(maxPrice || 20000).toLocaleString()}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* In-Stock Toggle */}
      <div className="pt-1">
        <label className="flex items-center justify-between cursor-pointer group py-1">
          <span className="font-display text-xs uppercase tracking-wider font-bold text-obsidian group-hover:text-fire transition-colors">
            In-Stock Pairs Only
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={inStockOnly}
            onClick={() => setInStockOnly(!inStockOnly)}
            className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 ${
              inStockOnly ? "bg-fire" : "bg-ink-200"
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                inStockOnly ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </label>
      </div>

      {/* Reset Button */}
      {activeFiltersCount > 0 && (
        <button
          onClick={clearAllFilters}
          className="w-full flex items-center justify-center gap-1.5 text-fire hover:text-fire-hover font-mono text-xs font-bold py-2 border border-fire/30 hover:border-fire transition-colors"
        >
          <RotateCcw size={13} />
          <span>Reset All Filters ({activeFiltersCount})</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas">
      {/* 👟 Streetwear Editorial Hero Header */}
      <div className="relative bg-obsidian text-white border-b border-ink-900 overflow-hidden">
        {/* Subtle geometric grid background */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "28px 28px",
          }}
        />

        {/* Ambient glow accents */}
        <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-fire/20 rounded-full blur-[100px] -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[250px] bg-white/10 rounded-full blur-[80px] translate-y-1/2 pointer-events-none" />

        <div className="relative max-w-[1400px] mx-auto px-5 sm:px-8 pt-8 pb-10 sm:pb-12 text-center flex flex-col items-center">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-xs text-white/50 font-mono tracking-wide mb-4">
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight size={12} className="text-white/30" />
            <Link to="/shop" className="hover:text-white transition-colors">
              Shop
            </Link>
            {slug && (
              <>
                <ChevronRight size={12} className="text-white/30" />
                <span className="text-white font-bold capitalize">
                  {category?.name || slug}
                </span>
              </>
            )}
          </nav>

          {/* Title & Badge */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight font-extrabold capitalize text-white">
              {title}
            </h1>
            <span className="bg-fire text-white text-[11px] font-mono font-bold px-2.5 py-1 tracking-wider uppercase shadow-md">
              {loading ? "..." : isFlashEnded ? "0 Kicks" : `${displayProducts.length} Kicks`}
            </span>
          </div>

          {/* Tagline / Subtitle */}
          {category?.tagline ? (
            <p className="text-white/70 mt-3 text-sm sm:text-base max-w-xl mx-auto font-light leading-relaxed">
              {category.tagline}
            </p>
          ) : (
            <p className="text-white/60 mt-3 text-xs sm:text-sm max-w-lg mx-auto font-mono">
              Curated premium streetwear & verified drops with nationwide Cash on Delivery.
            </p>
          )}

          {/* Flash sale live countdown */}
          {mode === "flash" && settings?.flash_sale_end_time && (
            <div className="mt-6 flex flex-col items-center">
              <span className="text-fire font-mono text-xs uppercase tracking-widest font-bold mb-2 flex items-center gap-1.5">
                <Flame size={14} className="fill-fire animate-pulse" /> Sale Ends In
              </span>
              <Countdown endsAt={settings.flash_sale_end_time} />
            </div>
          )}

          {/* Quick Sub-Category Pill Bar (Visible across all screens, wrapped on mobile/small screens) */}
          <div className="flex flex-wrap items-center justify-center gap-2 py-2 mt-5 sm:mt-6 w-full max-w-4xl px-2">
            {[
              { label: "All Kicks", to: "/shop", active: mode === "all" },
              { label: "Retro & Highs", to: "/collections/retro", active: slug === "retro" },
              { label: "Streetwear", to: "/collections/streetwear", active: slug === "streetwear" },
              { label: "Runners", to: "/collections/runners", active: slug === "runners" },
              { label: "Slides", to: "/collections/slides", active: slug === "slides" },
              { label: "New In", to: "/new-arrivals", active: mode === "new" },
              { label: "Flash Sale", to: "/flash-sale", active: mode === "flash", hot: true },
            ].map((pill, idx) => (
              <Link
                key={idx}
                to={pill.to}
                className={`whitespace-nowrap px-4 py-1.5 text-xs font-mono transition-all duration-200 border shrink-0 flex items-center gap-1.5 ${
                  pill.active
                    ? "bg-fire text-white border-fire font-bold shadow-sm"
                    : pill.hot
                    ? "bg-fire/20 text-fire border-fire/50 hover:bg-fire hover:text-white"
                    : "bg-white/10 text-white/80 border-white/15 hover:border-white/40 hover:text-white hover:bg-white/15"
                }`}
              >
                {pill.hot && <Flame size={12} className="fill-current" />}
                {pill.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Main Catalog Section */}
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 py-8 flex gap-10">
        {/* Desktop Sticky Sidebar Filters */}
        <aside className="hidden lg:block w-64 shrink-0 self-start sticky top-28 pb-10">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-ink-200">
            <div className="flex items-center gap-2">
              <Sliders size={16} className="text-obsidian" />
              <h3 className="font-display text-sm uppercase tracking-wider font-bold">
                Filters
              </h3>
            </div>
            {activeFiltersCount > 0 && (
              <span className="font-mono text-xs font-bold text-fire">
                {activeFiltersCount} active
              </span>
            )}
          </div>
          {renderFilterGroups()}
        </aside>

        {/* Product Grid Column */}
        <div className="flex-1 min-w-0">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-ink-200">
            {/* Left: Mobile trigger & active chips count */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(true)}
                className="lg:hidden flex items-center gap-2 border border-ink-200 bg-white px-3.5 py-2 text-xs font-mono font-bold text-obsidian shadow-sm hover:border-obsidian transition-colors"
                data-testid="mobile-filters-btn"
              >
                <SlidersHorizontal size={14} />
                <span>Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
              </button>

              <span className="text-ink-500 text-xs font-mono">
                {loading ? "Searching drops…" : isFlashEnded ? "0 kicks" : `${displayProducts.length} kicks available`}
              </span>
            </div>

            {/* Right: Grid Switcher + Sort Menu */}
            <div className="flex items-center gap-3 ml-auto">
              {/* Grid / Horizontal List Switcher */}
              <div className="flex items-center border border-ink-200 bg-white p-0.5 shadow-sm">
                <button
                  onClick={() => setGridCols("list")}
                  className={`p-1.5 transition-colors ${
                    gridCols === "list" ? "bg-obsidian text-white" : "text-ink-400 hover:text-obsidian"
                  }`}
                  title="Horizontal List View"
                  aria-label="Horizontal list view"
                >
                  <Rows3 size={16} />
                </button>
                <button
                  onClick={() => setGridCols(2)}
                  className={`p-1.5 transition-colors ${
                    gridCols === 2 ? "bg-obsidian text-white" : "text-ink-400 hover:text-obsidian"
                  }`}
                  title="2-Column Grid"
                  aria-label="2 columns"
                >
                  <Grid2X2 size={16} />
                </button>
                <button
                  onClick={() => setGridCols(3)}
                  className={`hidden sm:block p-1.5 transition-colors ${
                    gridCols === 3 ? "bg-obsidian text-white" : "text-ink-400 hover:text-obsidian"
                  }`}
                  title="3-Column Grid"
                  aria-label="3 columns"
                >
                  <Grid3X3 size={16} />
                </button>
                <button
                  onClick={() => setGridCols(4)}
                  className={`hidden md:block p-1.5 transition-colors ${
                    gridCols === 4 ? "bg-obsidian text-white" : "text-ink-400 hover:text-obsidian"
                  }`}
                  title="4-Column Grid"
                  aria-label="4 columns"
                >
                  <LayoutGrid size={16} />
                </button>
              </div>

              {/* Sort Selector */}
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  data-testid="sort-select"
                  className="appearance-none border border-ink-200 bg-white pl-3.5 pr-8 py-2 text-xs font-mono font-bold text-obsidian cursor-pointer hover:border-obsidian focus:outline-none focus:border-fire transition-colors shadow-sm"
                >
                  {SORTS.map((s) => (
                    <option key={s.v} value={s.v}>
                      {s.l}
                    </option>
                  ))}
                </select>
                <ArrowUpDown
                  size={12}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
                />
              </div>
            </div>
          </div>

          {/* Active Filter Chips Bar */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="font-mono text-xs text-ink-400 mr-1">Active:</span>

              {size && (
                <span className="inline-flex items-center gap-1.5 bg-white border border-ink-200 px-2.5 py-1 text-xs font-mono text-obsidian shadow-sm">
                  <span>Size: EU {size}</span>
                  <button onClick={() => setSize("")} className="hover:text-fire">
                    <X size={12} />
                  </button>
                </span>
              )}

              {brand.map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center gap-1.5 bg-white border border-ink-200 px-2.5 py-1 text-xs font-mono text-obsidian capitalize shadow-sm"
                >
                  <span>Brand: {b.replace("-", " ")}</span>
                  <button
                    onClick={() => setBrand((prev) => prev.filter((x) => x !== b))}
                    className="hover:text-fire"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}

              {catFilter.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1.5 bg-white border border-ink-200 px-2.5 py-1 text-xs font-mono text-obsidian capitalize shadow-sm"
                >
                  <span>Category: {c}</span>
                  <button
                    onClick={() => setCatFilter((prev) => prev.filter((x) => x !== c))}
                    className="hover:text-fire"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}

              {(maxPrice || minPrice) && (
                <span className="inline-flex items-center gap-1.5 bg-white border border-ink-200 px-2.5 py-1 text-xs font-mono text-obsidian shadow-sm">
                  <span>
                    Price: {minPrice ? `Rs. ${minPrice}` : ""} - {maxPrice ? `Rs. ${maxPrice}` : "Max"}
                  </span>
                  <button
                    onClick={() => {
                      setMinPrice("");
                      setMaxPrice("");
                    }}
                    className="hover:text-fire"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}

              {inStockOnly && (
                <span className="inline-flex items-center gap-1.5 bg-white border border-ink-200 px-2.5 py-1 text-xs font-mono text-obsidian shadow-sm">
                  <span>In-Stock Only</span>
                  <button onClick={() => setInStockOnly(false)} className="hover:text-fire">
                    <X size={12} />
                  </button>
                </span>
              )}

              <button
                onClick={clearAllFilters}
                className="text-xs font-mono font-bold text-fire hover:underline ml-2"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Products Grid / Skeletons / Empty */}
          {loading ? (
            gridCols === "list" ? (
              <div className="flex flex-col gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="border border-ink-200 p-4 bg-white flex flex-col sm:flex-row gap-4 animate-pulse shadow-sm"
                  >
                    <div className="bg-ink-100 aspect-square w-full sm:w-48 md:w-56 shrink-0" />
                    <div className="flex-1 space-y-3 py-2">
                      <div className="h-3 bg-ink-200 w-1/4" />
                      <div className="h-5 bg-ink-200 w-3/4" />
                      <div className="h-4 bg-ink-200 w-1/3" />
                      <div className="h-8 bg-ink-200 w-full max-w-xs mt-4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={gridClass}>
                {Array.from({ length: 9 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            )
          ) : isFlashEnded ? (
            <EmptyState
              icon={Package}
              title="Flash Sale Ended"
              subtitle="All flash deals have concluded for this round. Stay tuned for upcoming limited drops!"
            />
          ) : displayProducts.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-ink-200 p-8 bg-white">
              <Package size={40} className="mx-auto text-ink-300 mb-3" />
              <h3 className="font-display text-lg font-bold text-obsidian">No Kicks Found</h3>
              <p className="text-ink-500 text-xs font-mono mt-1 max-w-sm mx-auto">
                No sneakers match your current filter combination. Try clearing your filters to explore all available stock.
              </p>
              <button
                onClick={clearAllFilters}
                className="mt-5 inline-flex items-center gap-2 bg-obsidian text-white font-mono text-xs font-bold px-4 py-2.5 hover:bg-fire transition-colors"
              >
                <RotateCcw size={14} />
                <span>Reset Filters</span>
              </button>
            </div>
          ) : (
            <motion.div layout className={gridClass}>
              {displayProducts.map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  index={i}
                  layout={gridCols === "list" ? "horizontal" : "grid"}
                  onQuickView={(prod) => setQuickViewProduct(prod)}
                />
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-obsidian/70 backdrop-blur-sm z-50 lg:hidden"
              onClick={() => setShowFilters(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 280 }}
              className="fixed bottom-0 inset-x-0 max-h-[85vh] overflow-y-auto bg-canvas z-50 p-6 rounded-t-2xl shadow-2xl lg:hidden flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center pb-4 mb-6 border-b border-ink-200">
                  <div className="flex items-center gap-2">
                    <Sliders size={18} />
                    <h3 className="font-display font-bold text-base">Filters</h3>
                    {activeFiltersCount > 0 && (
                      <span className="bg-fire text-white text-[10px] font-mono font-bold px-2 py-0.5">
                        {activeFiltersCount}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="h-8 w-8 grid place-items-center rounded-full hover:bg-ink-100"
                  >
                    <X size={20} />
                  </button>
                </div>

                {renderFilterGroups()}
              </div>

              <div className="pt-6 mt-6 border-t border-ink-200 flex gap-3 sticky bottom-0 bg-canvas">
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="border border-ink-200 font-mono text-xs font-bold px-4 py-3.5 hover:border-obsidian transition-colors"
                  >
                    Reset
                  </button>
                )}
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex-1 bg-obsidian text-white font-display text-sm tracking-wider py-3.5 hover:bg-fire transition-colors font-bold shadow-md"
                >
                  Show {displayProducts.length} Kicks
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}
