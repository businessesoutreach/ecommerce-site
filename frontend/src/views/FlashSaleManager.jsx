import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Clock, Plus, Trash2, Edit2, Search, Check, AlertCircle, RefreshCw, Zap, Percent, DollarSign, Calendar, X } from 'lucide-react';
import { http, fmt, imgUrl } from '../lib/api';
import { toast } from 'sonner';

export default function FlashSaleManager({ isDark }) {
  const [loading, setLoading] = useState(true);
  const [savingCampaign, setSavingCampaign] = useState(false);
  const [campaign, setCampaign] = useState({
    flash_sale_active: false,
    flash_sale_end_time: ''
  });
  const [products, setProducts] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');

  // Add Product Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
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

  // Open add product modal
  const handleOpenAddModal = async () => {
    setShowAddModal(true);
    setSelectedProduct(null);
    setCatalogSearch('');
    setDiscountPercent(20);
    setCustomFlashPrice('');
    setPricingMode('percent');
    
    setLoadingCatalog(true);
    try {
      const res = await http.get('/admin/products?limit=200');
      const all = res.data?.data?.products || res.data?.data || [];
      // Filter out products already in flash sale
      const flashSaleIds = new Set(products.map(p => p.id));
      setCatalogProducts(all.filter(p => !flashSaleIds.has(p.id)));
    } catch (err) {
      toast.error('Failed to load products');
    }
    setLoadingCatalog(false);
  };

  // Add product to flash sale
  const handleAddProduct = async () => {
    if (!selectedProduct) {
      toast.error('Please select a product');
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
        toast.success(`${selectedProduct.name} added to Flash Sale at ${fmt(finalPrice)}`);
        setShowAddModal(false);
        loadData();
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add product to flash sale');
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
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

        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
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
            className="p-2 text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-gray-100 dark:bg-zinc-800 rounded-xl transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Campaign Configuration & Countdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Master Campaign Switch */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm space-y-4">
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
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm space-y-4">
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
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
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
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-5 border-b border-gray-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-bold text-sm text-gray-900 dark:text-zinc-100">
              Flash Sale Sneaker Drops ({products.length})
            </h2>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
              These products will appear on the Flash Drop section and discounted in cart during the active window.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search flash kicks..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-8 pr-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-fire w-48 sm:w-64"
              />
            </div>

            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-fire text-white rounded-xl text-xs font-bold hover:bg-fire/90 transition-colors flex items-center gap-1.5 shadow-sm shrink-0"
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
              Click the "Add Kick to Sale" button above to select items from your catalog and set special discounted pricing.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
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

      {/* MODAL 1: ADD PRODUCT TO FLASH SALE */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-fire/10 text-fire flex items-center justify-center">
                    <Plus size={18} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-gray-900 dark:text-zinc-100">
                      Add Product to Flash Sale
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-zinc-400">
                      Select a sneaker and set its campaign price.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-zinc-100 rounded-lg"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-5 flex-1">
                {/* Step 1: Select Product */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5">
                    1. Select Kick from Catalog
                  </label>
                  
                  <div className="relative mb-2">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by kick title..."
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      className="w-full pl-8 pr-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-fire"
                    />
                  </div>

                  {loadingCatalog ? (
                    <div className="p-8 text-center text-xs text-gray-400">
                      <RefreshCw size={18} className="animate-spin mx-auto mb-2 text-fire" />
                      Loading catalog...
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-zinc-800 rounded-xl divide-y divide-gray-100 dark:divide-zinc-800">
                      {catalogProducts
                        .filter(p => p.name.toLowerCase().includes(catalogSearch.toLowerCase()))
                        .map(p => {
                          const isSelected = selectedProduct?.id === p.id;
                          const img = Array.isArray(p.images) ? p.images[0] : (typeof p.images === 'string' ? JSON.parse(p.images || '[]')[0] : '');
                          return (
                            <div
                              key={p.id}
                              onClick={() => {
                                setSelectedProduct(p);
                                if (pricingMode === 'percent') {
                                  setCustomFlashPrice(Math.round(p.base_price * (1 - discountPercent / 100)));
                                } else {
                                  setCustomFlashPrice(Math.round(p.base_price * 0.8));
                                }
                              }}
                              className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                                isSelected 
                                  ? 'bg-purple-50 dark:bg-purple-950/30 border-l-4 border-l-purple-600' 
                                  : 'hover:bg-gray-50 dark:hover:bg-zinc-800/60'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={imgUrl(img)}
                                  alt={p.name}
                                  className="h-9 w-9 rounded-lg object-cover bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shrink-0"
                                />
                                <div>
                                  <div className="text-xs font-bold text-gray-900 dark:text-zinc-100">{p.name}</div>
                                  <div className="text-[10px] text-gray-400">{p.category_slug}</div>
                                </div>
                              </div>
                              <div className="font-mono text-xs font-bold text-gray-600 dark:text-zinc-300">
                                {fmt(p.base_price)}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* Step 2: Configure Flash Sale Price */}
                {selectedProduct && (
                  <div className="p-4 bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700/60 rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                        2. Set Flash Sale Price
                      </label>
                      <span className="font-mono text-xs text-gray-500">
                        Original: <strong className="text-gray-900 dark:text-zinc-100">{fmt(selectedProduct.base_price)}</strong>
                      </span>
                    </div>

                    {/* Mode Tabs */}
                    <div className="flex rounded-lg bg-gray-200 dark:bg-zinc-700/60 p-1">
                      <button
                        type="button"
                        onClick={() => setPricingMode('percent')}
                        className={`flex-1 py-1 text-xs font-bold rounded-md transition-colors ${
                          pricingMode === 'percent'
                            ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 shadow-xs'
                            : 'text-gray-500 dark:text-zinc-400'
                        }`}
                      >
                        % Discount Off
                      </button>
                      <button
                        type="button"
                        onClick={() => setPricingMode('manual')}
                        className={`flex-1 py-1 text-xs font-bold rounded-md transition-colors ${
                          pricingMode === 'manual'
                            ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 shadow-xs'
                            : 'text-gray-500 dark:text-zinc-400'
                        }`}
                      >
                        Exact Sale Price
                      </button>
                    </div>

                    {pricingMode === 'percent' ? (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {[10, 15, 20, 25, 30, 40, 50].map(pct => (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => setDiscountPercent(pct)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                                discountPercent === pct
                                  ? 'bg-purple-600 text-white border-purple-600'
                                  : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border-gray-200 dark:border-zinc-700 hover:border-gray-300'
                              }`}
                            >
                              {pct}% OFF
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800">
                          <span className="text-xs text-gray-500">Calculated Sale Price:</span>
                          <span className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400">
                            {fmt(Math.round(selectedProduct.base_price * (1 - discountPercent / 100)))}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-gray-500">Enter Exact Flash Sale Price</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs">Rs.</span>
                          <input
                            type="number"
                            min="1"
                            max={selectedProduct.base_price - 1}
                            value={customFlashPrice}
                            onChange={(e) => setCustomFlashPrice(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-mono font-bold text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-fire"
                            placeholder="e.g. 8500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-gray-50 dark:bg-zinc-800/40 border-t border-gray-200 dark:border-zinc-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddProduct}
                  disabled={!selectedProduct || submittingProduct}
                  className="px-5 py-2 bg-fire text-white rounded-xl text-xs font-bold hover:bg-fire/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submittingProduct ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                  Add to Flash Sale
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: EDIT EXISTING FLASH SALE PRICE */}
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
