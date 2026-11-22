import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, 
  Clock, 
  Plus, 
  Trash2, 
  Edit2, 
  Search, 
  Check, 
  RefreshCw, 
  Zap, 
  Percent, 
  DollarSign, 
  Calendar, 
  X, 
  ArrowLeft, 
  Sparkles,
  ShoppingBag,
  Tag
} from 'lucide-react';
import { http, fmt, imgUrl } from '../lib/api';
import { toast } from 'sonner';

export default function FlashSaleManager({ isDark }) {
  // Navigation view: 'list' (dashboard) or 'add' (dedicated full page)
  const [view, setView] = useState('list');

  const [loading, setLoading] = useState(true);
  const [savingCampaign, setSavingCampaign] = useState(false);
  const [campaign, setCampaign] = useState({
    flash_sale_active: false,
    flash_sale_end_time: ''
  });
  const [products, setProducts] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');

  // Add Product Dedicated Page state
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [discountPercent, setDiscountPercent] = useState(20);
  const [customFlashPrice, setCustomFlashPrice] = useState('');
  const [pricingMode, setPricingMode] = useState('percent'); // 'percent' | 'manual'
  const [submittingProduct, setSubmittingProduct] = useState(false);

  // Edit Price Modal state
  const [editingProduct, setEditingProduct] = useState(null);
  const [editPriceInput, setEditPriceInput] = useState('');
  const [savingEditPrice, setSavingEditPrice] = useState(false);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await http.get('/admin/flash-sale');
      if (res.data?.success) {
        const { settings, products } = res.data.data;
        const endTimeStr = settings?.flash_sale_end_time 
          ? new Date(settings.flash_sale_end_time).toISOString().slice(0, 16) 
          : '';
        setCampaign({
          flash_sale_active: !!settings?.flash_sale_active,
          flash_sale_end_time: endTimeStr
        });
        setProducts(products || []);
      }
    } catch (err) {
      toast.error('Failed to load flash sale data');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Countdown calculation
  useEffect(() => {
    if (!campaign.flash_sale_end_time) {
      setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
      return;
    }

    const calculate = () => {
      const target = new Date(campaign.flash_sale_end_time).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds, expired: false });
      }
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [campaign.flash_sale_end_time]);

  // Save campaign settings (active toggle + end time)
  const saveCampaign = async () => {
    setSavingCampaign(true);
    try {
      const payload = {
        flash_sale_active: campaign.flash_sale_active,
        flash_sale_end_time: campaign.flash_sale_end_time ? new Date(campaign.flash_sale_end_time).toISOString() : null
      };
      await http.patch('/admin/settings', payload);
      toast.success('Flash Sale campaign settings updated');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update campaign settings');
    }
    setSavingCampaign(false);
  };

  // Quick preset helper
  const applyPresetTime = (hours) => {
    const d = new Date();
    d.setHours(d.getHours() + hours);
    setCampaign(prev => ({
      ...prev,
      flash_sale_end_time: d.toISOString().slice(0, 16)
    }));
  };

  // Open the dedicated Add Kick page
  const handleOpenAddPage = async () => {
    setView('add');
    setSelectedProduct(null);
    setCatalogSearch('');
    setCatalogCategory('all');
    setDiscountPercent(20);
    setCustomFlashPrice('');
    setPricingMode('percent');
    
    setLoadingCatalog(true);
    try {
      const res = await http.get('/admin/products?limit=250');
      const all = res.data?.data?.products || res.data?.data || [];
      // Filter out kicks already in flash sale
      const flashSaleIds = new Set(products.map(p => p.id));
      setCatalogProducts(all.filter(p => !flashSaleIds.has(p.id)));
    } catch (err) {
      toast.error('Failed to load catalog kicks');
    }
    setLoadingCatalog(false);
  };

  // Select a kick to configure in the Add page
  const handleSelectKick = (kick) => {
    setSelectedProduct(kick);
    if (pricingMode === 'percent') {
      const disc = Number(discountPercent) || 20;
      setCustomFlashPrice(Math.round(kick.base_price * (1 - disc / 100)));
    } else {
      setCustomFlashPrice(Math.round(kick.base_price * 0.8));
    }
  };

  // Add product to flash sale
  const handleAddProduct = async () => {
    if (!selectedProduct) {
      toast.error('Please select a sneaker first');
      return;
    }

    let finalPrice;
    if (pricingMode === 'percent') {
      const disc = Math.min(99, Math.max(1, Number(discountPercent) || 20));
      finalPrice = Math.round(selectedProduct.base_price * (1 - disc / 100));
    } else {
      finalPrice = Number(customFlashPrice);
      if (!finalPrice || finalPrice <= 0 || finalPrice >= selectedProduct.base_price) {
        toast.error(`Price must be between Rs. 1 and ${fmt(selectedProduct.base_price - 1)}`);
        return;
      }
    }

    setSubmittingProduct(true);
    try {
      const res = await http.post('/admin/flash-sale/products', {
        product_id: selectedProduct.id,
        flash_sale_price: finalPrice
      });
      if (res.data?.success) {
        toast.success(`${selectedProduct.name} added to Flash Sale at ${fmt(finalPrice)}!`);
        await loadData();
        setView('list');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add sneaker to flash sale');
    }
    setSubmittingProduct(false);
  };

  // Remove product from flash sale
  const handleRemoveProduct = async (product) => {
    if (!window.confirm(`Remove "${product.name}" from Flash Sale?`)) return;
    try {
      await http.delete(`/admin/flash-sale/products/${product.id}`);
      setProducts(prev => prev.filter(p => p.id !== product.id));
      toast.success(`${product.name} removed from Flash Sale`);
    } catch (err) {
      toast.error('Failed to remove product');
    }
  };

  // Update existing flash sale price
  const handleSavePriceEdit = async () => {
    if (!editingProduct) return;
    const newPrice = Number(editPriceInput);
    if (!newPrice || newPrice <= 0 || newPrice >= editingProduct.base_price) {
      toast.error(`Price must be lower than original price ${fmt(editingProduct.base_price)}`);
      return;
    }

    setSavingEditPrice(true);
    try {
      await http.patch(`/admin/flash-sale/products/${editingProduct.id}`, {
        flash_sale_price: newPrice
      });
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, flash_sale_price: newPrice } : p));
      toast.success('Flash sale price updated');
      setEditingProduct(null);
    } catch (err) {
      toast.error('Failed to update price');
    }
    setSavingEditPrice(false);
  };

  // Filtered products for table
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (p.category_slug && p.category_slug.toLowerCase().includes(searchFilter.toLowerCase())) ||
    (p.brand_slug && p.brand_slug.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  // Categories available in catalog
  const catalogCategories = ['all', ...new Set(catalogProducts.map(p => p.category_slug).filter(Boolean))];

  // Filtered kicks for Add page
  const filteredCatalog = catalogProducts.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      (p.slug && p.slug.toLowerCase().includes(catalogSearch.toLowerCase()));
    const matchCat = catalogCategory === 'all' || p.category_slug === catalogCategory;
    return matchSearch && matchCat;
  });

  // Average discount across all flash sale items
  const avgDiscount = products.length > 0
    ? Math.round(products.reduce((acc, p) => {
        const disc = p.base_price > 0 && p.flash_sale_price 
          ? ((p.base_price - p.flash_sale_price) / p.base_price) * 100 
          : 0;
        return acc + disc;
      }, 0) / products.length)
    : 0;

  const isLive = campaign.flash_sale_active && !timeLeft.expired;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-gray-400">
        <RefreshCw size={28} className="animate-spin mb-3 text-fire" />
        <p className="text-sm font-semibold">Loading Flash Sale configuration...</p>
      </div>
    );
  }

  // =========================================================================
  // VIEW: DEDICATED FULL PAGE FOR ADDING A KICK TO FLASH SALE
  // =========================================================================
  if (view === 'add') {
    const calculatedSalePrice = selectedProduct
      ? pricingMode === 'percent'
        ? Math.round(selectedProduct.base_price * (1 - (Number(discountPercent) || 20) / 100))
        : Number(customFlashPrice) || 0
      : 0;

    const savingsAmount = selectedProduct ? Math.max(0, selectedProduct.base_price - calculatedSalePrice) : 0;
    const computedDiscountPct = selectedProduct && selectedProduct.base_price > 0
      ? Math.round((savingsAmount / selectedProduct.base_price) * 100)
      : 0;

    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Navigation Breadcrumb / Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('list')}
              className="p-2 text-gray-600 dark:text-zinc-300 hover:text-fire dark:hover:text-fire hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              title="Back to Flash Sale List"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 dark:text-zinc-500">Flash Sale</span>
                <span className="text-xs text-gray-300 dark:text-zinc-700">/</span>
                <span className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-wide">Add Sneaker</span>
              </div>
              <h1 className="text-lg font-display font-black text-gray-900 dark:text-zinc-100">
                Select Kick & Configure Promotional Price
              </h1>
            </div>
          </div>

          <button
            onClick={() => setView('list')}
            className="px-4 py-2 border border-gray-200 dark:border-zinc-700 text-xs font-bold rounded-xl text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors self-start sm:self-auto"
          >
            Cancel & Return
          </button>
        </div>

        {/* Two-Column Responsive Studio Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Catalog Picker (7 cols on lg) */}
          <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h2 className="font-display font-bold text-sm text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                <ShoppingBag size={16} className="text-fire" /> 1. Choose a Sneaker from Catalog
              </h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                Click any kick to select it and preview discounted campaign pricing.
              </p>
            </div>

            {/* Search & Category Filter Toolbar */}
            <div className="space-y-3">
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search sneaker by name or slug..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-fire"
                />
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-1.5">
                {catalogCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCatalogCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase transition-colors ${
                      catalogCategory === cat
                        ? 'bg-obsidian text-white dark:bg-fire'
                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog Grid / List */}
            {loadingCatalog ? (
              <div className="p-16 text-center text-gray-400">
                <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-fire" />
                <span className="text-xs font-bold">Loading eligible kicks...</span>
              </div>
            ) : filteredCatalog.length === 0 ? (
              <div className="p-12 text-center text-gray-400 dark:text-zinc-500 border border-dashed border-gray-200 dark:border-zinc-800 rounded-xl space-y-1">
                <p className="text-xs font-bold text-gray-600 dark:text-zinc-300">No available kicks found</p>
                <p className="text-[11px]">All matching sneakers are either already in Flash Sale or not in catalog.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[560px] overflow-y-auto pr-1">
                {filteredCatalog.map(p => {
                  const isSelected = selectedProduct?.id === p.id;
                  const img = Array.isArray(p.images) ? p.images[0] : (typeof p.images === 'string' ? JSON.parse(p.images || '[]')[0] : '');

                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectKick(p)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 shadow-sm ring-2 ring-purple-600/20'
                          : 'border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/60'
                      }`}
                    >
                      <img
                        src={imgUrl(img)}
                        alt={p.name}
                        className="h-14 w-14 rounded-lg object-cover bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-gray-900 dark:text-zinc-100 truncate">
                          {p.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">
                            {p.category_slug}
                          </span>
                          <span className="text-[10px] text-gray-300 dark:text-zinc-700">•</span>
                          <span className="font-mono text-xs font-bold text-gray-700 dark:text-zinc-300">
                            {fmt(p.base_price)}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="h-6 w-6 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                          <Check size={14} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Price Configuration & Preview (5 cols on lg) */}
          <div className="lg:col-span-5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6 lg:sticky lg:top-20">
            <div>
              <h2 className="font-display font-bold text-sm text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                <Tag size={16} className="text-purple-600 dark:text-purple-400" /> 2. Set Promotional Pricing
              </h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                Apply a percentage discount or set a specific price in Pakistani Rupees.
              </p>
            </div>

            {!selectedProduct ? (
              <div className="p-10 border border-dashed border-gray-200 dark:border-zinc-800 rounded-xl text-center text-gray-400 dark:text-zinc-500 space-y-2">
                <Flame size={32} className="mx-auto text-gray-300 dark:text-zinc-700" />
                <p className="text-xs font-bold text-gray-700 dark:text-zinc-300">No Sneaker Selected</p>
                <p className="text-[11px] leading-relaxed max-w-xs mx-auto">
                  Click any sneaker from the catalog list on the left to set its flash discount.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Selected Item Brief */}
                <div className="flex items-center gap-3.5 p-3.5 bg-gray-50 dark:bg-zinc-800/60 rounded-xl border border-gray-200 dark:border-zinc-700/60">
                  {(() => {
                    const img = Array.isArray(selectedProduct.images) ? selectedProduct.images[0] : (typeof selectedProduct.images === 'string' ? JSON.parse(selectedProduct.images || '[]')[0] : '');
                    return (
                      <img
                        src={imgUrl(img)}
                        alt={selectedProduct.name}
                        className="h-12 w-12 rounded-lg object-cover bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shrink-0"
                      />
                    );
                  })()}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-gray-900 dark:text-zinc-100 truncate">{selectedProduct.name}</div>
                    <div className="text-[11px] text-gray-500">Regular Retail: <strong className="font-mono text-gray-900 dark:text-zinc-100">{fmt(selectedProduct.base_price)}</strong></div>
                  </div>
                </div>

                {/* Pricing Mode Toggle */}
                <div className="flex rounded-xl bg-gray-100 dark:bg-zinc-800 p-1 border border-gray-200 dark:border-zinc-700">
                  <button
                    type="button"
                    onClick={() => setPricingMode('percent')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      pricingMode === 'percent'
                        ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 shadow-sm'
                        : 'text-gray-500 dark:text-zinc-400'
                    }`}
                  >
                    % Discount Off
                  </button>
                  <button
                    type="button"
                    onClick={() => setPricingMode('manual')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      pricingMode === 'manual'
                        ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 shadow-sm'
                        : 'text-gray-500 dark:text-zinc-400'
                    }`}
                  >
                    Exact Sale Price
                  </button>
                </div>

                {/* Pricing Inputs */}
                {pricingMode === 'percent' ? (
                  <div className="space-y-3">
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-zinc-400">
                      Select Discount Percentage
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[10, 15, 20, 25, 30, 40, 50, 60].map(pct => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setDiscountPercent(pct)}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                            discountPercent === pct
                              ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                              : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border-gray-200 dark:border-zinc-700 hover:border-gray-300'
                          }`}
                        >
                          {pct}% OFF
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-zinc-400">
                      Enter Exact Sale Price (PKR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs">Rs.</span>
                      <input
                        type="number"
                        min="1"
                        max={selectedProduct.base_price - 1}
                        value={customFlashPrice}
                        onChange={(e) => setCustomFlashPrice(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-mono font-bold text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-fire"
                        placeholder="e.g. 8500"
                      />
                    </div>
                  </div>
                )}

                {/* Live Financial Breakdown Card */}
                <div className="bg-purple-50/50 dark:bg-zinc-800/60 border border-purple-200 dark:border-zinc-700/80 rounded-xl p-4 space-y-2.5">
                  <div className="flex justify-between text-xs text-gray-600 dark:text-zinc-400">
                    <span>Original Price:</span>
                    <span className="font-mono">{fmt(selectedProduct.base_price)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-purple-600 dark:text-purple-400 font-bold">
                    <span>Discount Savings ({computedDiscountPct}%):</span>
                    <span className="font-mono">-{fmt(savingsAmount)}</span>
                  </div>
                  <div className="border-t border-purple-200 dark:border-zinc-700 pt-2 flex justify-between items-center">
                    <span className="text-xs font-black text-gray-900 dark:text-zinc-100 uppercase">Flash Drop Price:</span>
                    <span className="font-mono text-lg font-black text-emerald-600 dark:text-emerald-400">
                      {fmt(calculatedSalePrice)}
                    </span>
                  </div>
                </div>

                {/* Primary Submit Button */}
                <button
                  type="button"
                  onClick={handleAddProduct}
                  disabled={submittingProduct || calculatedSalePrice <= 0 || calculatedSalePrice >= selectedProduct.base_price}
                  className="w-full py-3 bg-fire text-white rounded-xl text-xs font-bold hover:bg-fire/90 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {submittingProduct ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}
                  Confirm & Add to Flash Sale
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: MAIN FLASH SALE DASHBOARD (LIST VIEW)
  // =========================================================================
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Banner - Responsive */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-5 sm:p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Flame size={20} className="fill-purple-600 text-purple-600 dark:fill-purple-400 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-display font-black text-gray-900 dark:text-zinc-100 tracking-tight">
                Flash Sale Management
              </h1>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                Manage global countdown timers, campaign status, and dedicated flash sale kick prices.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 shrink-0 ${
            isLive 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : campaign.flash_sale_active && timeLeft.expired
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
              : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-zinc-700'
          }`}>
            <span className={`h-2 w-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : campaign.flash_sale_active ? 'bg-rose-500' : 'bg-gray-400'}`} />
            {isLive ? 'LIVE ON STOREFRONT' : campaign.flash_sale_active ? 'CAMPAIGN EXPIRED' : 'CAMPAIGN PAUSED'}
          </div>

          <button
            onClick={loadData}
            className="p-2 text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-gray-100 dark:bg-zinc-800 rounded-xl transition-colors shrink-0"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Campaign Configuration & Countdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {/* Card 1: Master Campaign Switch */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-5 sm:p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800">
            <span className="font-display font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-zinc-300 flex items-center gap-2">
              <Zap size={14} className="text-fire" /> Campaign Switch
            </span>
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${campaign.flash_sale_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-200 dark:bg-zinc-800 text-gray-500'}`}>
              {campaign.flash_sale_active ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
            When enabled, the Flash Drop countdown and special flash prices will be visible to shoppers across the storefront.
          </p>

          <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-200 dark:border-zinc-700/60 cursor-pointer">
            <input
              type="checkbox"
              checked={campaign.flash_sale_active}
              onChange={(e) => setCampaign({ ...campaign, flash_sale_active: e.target.checked })}
              className="accent-fire w-5 h-5 rounded cursor-pointer"
            />
            <div>
              <span className="text-xs font-bold text-gray-900 dark:text-zinc-100 block">
                Activate Flash Sale Campaign
              </span>
              <span className="text-[11px] text-gray-500 dark:text-zinc-400">
                Turns on storefront countdown & discounted checkout prices
              </span>
            </div>
          </label>
        </div>

        {/* Card 2: Ending Date & Time Schedule */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-5 sm:p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800">
            <span className="font-display font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-zinc-300 flex items-center gap-2">
              <Calendar size={14} className="text-purple-600 dark:text-purple-400" /> End Date & Time
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 dark:text-zinc-400 mb-1.5">
              Campaign Expiration Date
            </label>
            <input
              type="datetime-local"
              value={campaign.flash_sale_end_time}
              onChange={(e) => setCampaign({ ...campaign, flash_sale_end_time: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-mono text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-fire"
            />
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 block mb-1.5">
              Quick Extension Presets:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '+24 Hours', hours: 24 },
                { label: '+3 Days', hours: 72 },
                { label: '+7 Days', hours: 168 },
                { label: '+30 Days', hours: 720 },
              ].map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPresetTime(preset.hours)}
                  className="px-2.5 py-1 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg text-[10px] font-bold text-gray-600 dark:text-zinc-300 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Card 3: Live Countdown Ticker & Action */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-5 sm:p-6 rounded-2xl shadow-sm flex flex-col justify-between space-y-4 md:col-span-2 xl:col-span-1">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800 mb-3">
              <span className="font-display font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-zinc-300 flex items-center gap-2">
                <Clock size={14} className="text-fire" /> Remaining Time
              </span>
              <span className="text-[10px] font-mono text-gray-400">
                {products.length} Products • {avgDiscount}% Avg Off
              </span>
            </div>

            {/* Countdown Blocks */}
            <div className="grid grid-cols-4 gap-2 text-center my-2">
              {[
                { val: timeLeft.days, unit: 'DAYS' },
                { val: timeLeft.hours, unit: 'HOURS' },
                { val: timeLeft.minutes, unit: 'MINS' },
                { val: timeLeft.seconds, unit: 'SECS' },
              ].map(item => (
                <div key={item.unit} className="bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700/60 p-2.5 rounded-xl">
                  <div className="font-mono text-lg font-black text-gray-900 dark:text-zinc-100 leading-tight">
                    {timeLeft.expired ? '00' : String(item.val).padStart(2, '0')}
                  </div>
                  <div className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 tracking-wider mt-0.5">
                    {item.unit}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={saveCampaign}
            disabled={savingCampaign}
            className="w-full py-2.5 bg-obsidian text-white dark:bg-fire dark:text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {savingCampaign ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
            {savingCampaign ? 'Saving Campaign...' : 'Save Campaign Settings'}
          </button>
        </div>
      </div>

      {/* Flash Sale Products Table Card */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm">
        {/* Table Toolbar - Full Responsive Fix */}
        <div className="p-5 border-b border-gray-200 dark:border-zinc-800 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-bold text-sm text-gray-900 dark:text-zinc-100">
              Flash Sale Sneaker Drops ({products.length})
            </h2>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
              These products will appear on the Flash Drop section and discounted in cart during the active window.
            </p>
          </div>

          {/* Action Row: Search + Add Button with robust responsive wrapping */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search flash kicks..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-fire"
              />
            </div>

            <button
              onClick={handleOpenAddPage}
              className="px-4 py-2 bg-fire text-white rounded-xl text-xs font-bold hover:bg-fire/90 transition-colors flex items-center justify-center gap-1.5 shadow-sm shrink-0 whitespace-nowrap"
            >
              <Plus size={15} /> Add Kick to Sale
            </button>
          </div>
        </div>

        {/* Products Table */}
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-gray-400 dark:text-zinc-500 space-y-3">
            <Flame size={36} className="mx-auto text-gray-300 dark:text-zinc-700" />
            <div className="text-sm font-bold text-gray-600 dark:text-zinc-300">
              {searchFilter ? 'No products match your search.' : 'No products currently in Flash Sale.'}
            </div>
            <p className="text-xs max-w-sm mx-auto">
              Click the "Add Kick to Sale" button above to browse your catalog and set promotional discount pricing.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[620px] text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800 text-[11px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-5">Product</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Original Price</th>
                  <th className="py-3 px-4">Flash Sale Price</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60 text-xs">
                {filteredProducts.map((p) => {
                  const regularPrice = Number(p.base_price) || 0;
                  const salePrice = Number(p.flash_sale_price) || regularPrice;
                  const discount = regularPrice > 0 
                    ? Math.round(((regularPrice - salePrice) / regularPrice) * 100)
                    : 0;
                  const img = Array.isArray(p.images) ? p.images[0] : (typeof p.images === 'string' ? JSON.parse(p.images || '[]')[0] : '');

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={imgUrl(img)}
                            alt={p.name}
                            className="h-12 w-12 rounded-xl object-cover bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-gray-900 dark:text-zinc-100">{p.name}</div>
                            <div className="text-[11px] font-mono text-gray-400 dark:text-zinc-500">{p.slug}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 text-[10px] font-bold uppercase">
                          {p.category_slug || 'General'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-gray-500 dark:text-zinc-400">
                        {fmt(regularPrice)}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        <div className="flex items-center gap-1.5">
                          <span>{fmt(salePrice)}</span>
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setEditPriceInput(salePrice);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-zinc-100 rounded"
                            title="Edit Price"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-black text-[10px]">
                          {discount}% OFF
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => handleRemoveProduct(p)}
                          className="px-2.5 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                          title="Remove from Flash Sale"
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QUICK PRICE EDIT MODAL */}
      <AnimatePresence>
        {editingProduct && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800">
                <h3 className="font-display font-bold text-sm text-gray-900 dark:text-zinc-100">
                  Edit Flash Sale Price
                </h3>
                <button onClick={() => setEditingProduct(null)} className="p-1 text-gray-400">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-bold text-gray-900 dark:text-zinc-100">{editingProduct.name}</div>
                <div className="text-xs text-gray-500">Original Base Price: <strong className="font-mono text-gray-900 dark:text-zinc-100">{fmt(editingProduct.base_price)}</strong></div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">New Flash Sale Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs">Rs.</span>
                    <input
                      type="number"
                      min="1"
                      max={editingProduct.base_price - 1}
                      value={editPriceInput}
                      onChange={(e) => setEditPriceInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-mono font-bold text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-fire"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-3 py-1.5 text-xs font-bold text-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePriceEdit}
                  disabled={savingEditPrice}
                  className="px-4 py-1.5 bg-obsidian text-white dark:bg-fire dark:text-white rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-50"
                >
                  {savingEditPrice ? 'Saving...' : 'Update Price'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
