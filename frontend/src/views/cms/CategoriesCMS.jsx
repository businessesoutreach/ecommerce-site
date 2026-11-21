import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { http, fmt } from '../../lib/api';
import { toast } from "sonner";
import { 
  Trash2, Upload, Tag, Plus, Edit2, Check, X, Loader2, Image as ImageIcon, 
  Video, Search, ExternalLink, ArrowLeft, Package, Layers, Eye, Globe, ChevronRight 
} from 'lucide-react';

async function uploadCategoryPhoto(file) {
  const fd = new FormData();
  fd.append("file", file);
  const { data } = await http.post("/admin/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
  return data?.data?.url || data?.url;
}

export default function CategoriesCMS() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryId = searchParams.get("categoryId");
  const action = searchParams.get("action");

  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await http.get("/admin/categories");
      setCats(data.data || []);
    } catch (err) {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const closeCategory = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("action");
    next.delete("categoryId");
    setSearchParams(next);
  };

  const openNewCategory = () => {
    const next = new URLSearchParams(searchParams);
    next.set("action", "new");
    next.delete("categoryId");
    setSearchParams(next);
  };

  const openCategory = (id) => {
    const next = new URLSearchParams(searchParams);
    next.set("categoryId", id);
    next.delete("action");
    setSearchParams(next);
  };

  // FULL PAGE VIEW: Create Category
  if (action === "new") {
    return (
      <CategoryDetailPage
        isNew={true}
        existingCategories={cats}
        onBack={closeCategory}
        onSaved={(created) => {
          load();
          if (created?.id) {
            openCategory(created.id);
          } else {
            closeCategory();
          }
        }}
      />
    );
  }

  // FULL PAGE VIEW: View & Edit Category
  if (categoryId) {
    const existing = cats.find(c => c.id === categoryId || c.slug === categoryId);
    return (
      <CategoryDetailPage
        categoryId={categoryId}
        initialCategory={existing}
        existingCategories={cats}
        onBack={closeCategory}
        onSaved={load}
        onDelete={() => {
          closeCategory();
          load();
        }}
      />
    );
  }

  const del = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"? Products in this category will keep their current records.`)) return;
    try {
      await http.delete(`/admin/categories/${id}`);
      toast.success("Category deleted");
      load();
    } catch (err) {
      toast.error("Failed to delete category");
    }
  };

  const filteredCats = cats.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  const totalDrops = cats.reduce((acc, c) => acc + (Number(c.product_count) || 0), 0);
  const activeCount = cats.filter(c => c.is_active !== false).length;
  const rootCount = cats.filter(c => !c.parent_id).length;

  const STATS = [
    { label: "Total Collections", count: cats.length, color: "text-gray-900 dark:text-zinc-100", sub: "All categories configured" },
    { label: "Active in Storefront", count: activeCount, color: "text-emerald-600 dark:text-emerald-400", sub: "Visible to shoppers" },
    { label: "Categorized Drops", count: totalDrops, color: "text-fire", sub: "Sneaker pairs organized" },
    { label: "Root Categories", count: rootCount, color: "text-blue-600 dark:text-blue-400", sub: "Top level hierarchy" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display tracking-tight text-2xl font-black text-gray-900 dark:text-zinc-100 flex items-center gap-3">
            Product Categories & Collections
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-fire/10 text-fire border border-fire/20">
              {cats.length} Collections
            </span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Configure dynamic product categories, taxonomy hierarchy, storefront hero banners, and SEO metadata.
          </p>
        </div>
        <button
          onClick={openNewCategory}
          className="px-4 py-2 bg-fire hover:bg-fire-hover text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-2 shrink-0"
        >
          <Plus size={15} />
          <span>Add New Category</span>
        </button>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map(s => (
          <div key={s.label} className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">{s.label}</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl font-mono font-black ${s.color}`}>{s.count}</span>
            </div>
            <span className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1">{s.sub}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories by name or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-zinc-100 placeholder-gray-400 focus:outline-none focus:border-fire"
          />
        </div>
        <span className="text-xs font-mono font-bold text-gray-400">
          Showing {filteredCats.length} of {cats.length}
        </span>
      </div>

      {/* Categories Table */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-2">
            <Loader2 size={28} className="animate-spin text-fire" />
            <p className="text-xs font-bold text-gray-500">Loading categories...</p>
          </div>
        ) : filteredCats.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Tag size={32} className="mx-auto mb-2 opacity-40" />
            <p className="font-bold text-sm">No categories found</p>
            <p className="text-xs mt-1">Click "Add New Category" above to configure your first collection.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50/80 dark:bg-zinc-800/60 font-mono text-[10px] uppercase tracking-wider text-gray-500 dark:text-zinc-400 border-b border-gray-200 dark:border-zinc-800">
                <tr>
                  <th className="p-3.5 pl-5">Cover Banner</th>
                  <th className="p-3.5">Category Name</th>
                  <th className="p-3.5">Storefront Link</th>
                  <th className="p-3.5">Hierarchy</th>
                  <th className="p-3.5 text-center">Sneaker Drops</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right pr-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60">
                {filteredCats.map(c => {
                  const parent = cats.find(p => p.id === c.parent_id);
                  const isVisible = c.is_active !== false;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => openCategory(c.id)}
                      className="hover:bg-gray-50/80 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="p-3.5 pl-5" onClick={e => e.stopPropagation()}>
                        {c.hero_banner_url ? (
                          <img src={c.hero_banner_url} alt="" className="w-16 h-11 object-cover rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-100" />
                        ) : (
                          <div className="w-16 h-11 rounded-xl bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 grid place-items-center text-gray-400 text-[10px] font-bold">
                            NO IMG
                          </div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-sm text-gray-900 dark:text-zinc-100 block group-hover:text-fire transition-colors">
                          {c.name}
                        </span>
                        {c.description && (
                          <span className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                            {c.description}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-xs text-fire" onClick={e => e.stopPropagation()}>
                        <a
                          href={`/collections/${c.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline flex items-center gap-1"
                        >
                          /collections/{c.slug} <ExternalLink size={11} />
                        </a>
                      </td>
                      <td className="p-3.5">
                        {parent ? (
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-bold text-[10px]">
                            {parent.name}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[11px] font-medium">Root Collection</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="font-mono font-bold px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 border border-gray-200 dark:border-zinc-700">
                          {c.product_count || 0} drops
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          isVisible
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900'
                            : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-zinc-700'
                        }`}>
                          {isVisible ? "Active" : "Hidden"}
                        </span>
                      </td>
                      <td className="p-3.5 pr-5 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openCategory(c.id)}
                            className="px-2.5 py-1.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
                            title="Edit Category"
                          >
                            <Edit2 size={12} /> Edit
                          </button>
                          <button
                            onClick={() => del(c.id, c.name)}
                            className="p-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-400 rounded-lg transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}


/* =========================================================================
   DEDICATED FULL-PAGE COMPONENT: CategoryDetailPage (View, Edit & Create)
   Enterprise-grade Category Workbench with zero modals.
   ========================================================================= */

function CategoryDetailPage({ categoryId, initialCategory, existingCategories = [], isNew = false, onBack, onSaved, onDelete }) {
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [categoryData, setCategoryData] = useState(initialCategory || null);

  const [form, setForm] = useState({
    name: initialCategory?.name || "",
    slug: initialCategory?.slug || "",
    description: initialCategory?.description || "",
    hero_banner_url: initialCategory?.hero_banner_url || "",
    hero_video_url: initialCategory?.hero_video_url || "",
    seo_title: initialCategory?.seo_title || "",
    seo_description: initialCategory?.seo_description || "",
    parent_id: initialCategory?.parent_id || "",
    is_active: initialCategory?.is_active ?? true,
  });

  // Fetch complete details including assigned products and stats
  useEffect(() => {
    if (isNew || !categoryId) return;
    let mounted = true;
    const fetchCategory = async () => {
      try {
        const { data } = await http.get(`/admin/categories/${categoryId}`);
        if (mounted && data.data) {
          const c = data.data;
          setCategoryData(c);
          setForm({
            name: c.name || "",
            slug: c.slug || "",
            description: c.description || "",
            hero_banner_url: c.hero_banner_url || "",
            hero_video_url: c.hero_video_url || "",
            seo_title: c.seo_title || "",
            seo_description: c.seo_description || "",
            parent_id: c.parent_id || "",
            is_active: c.is_active ?? true,
          });
        }
      } catch (err) {
        toast.error("Failed to load category details");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchCategory();
    return () => { mounted = false; };
  }, [categoryId, isNew]);

  const handleUploadBanner = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadCategoryPhoto(file);
      if (url) {
        setForm(prev => ({ ...prev, hero_banner_url: url }));
        toast.success("Hero banner uploaded");
      }
    } catch {
      toast.error("Upload failed");
    }
  };

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!form.name.trim()) return toast.error("Category name is required");

    setSaving(true);
    const cleanSlug = form.slug.trim() || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const payload = {
      ...form,
      name: form.name.trim(),
      slug: cleanSlug,
      parent_id: form.parent_id || null,
      is_active: !!form.is_active,
    };

    try {
      if (isNew) {
        const res = await http.post("/admin/categories", payload);
        toast.success("Category created successfully!");
        onSaved(res.data?.data);
      } else {
        const res = await http.patch(`/admin/categories/${categoryId}`, payload);
        toast.success("Category updated successfully!");
        onSaved(res.data?.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isNew || !categoryId) return;
    if (!window.confirm(`Delete category "${form.name}"? Products in this category will keep their records.`)) return;
    try {
      await http.delete(`/admin/categories/${categoryId}`);
      toast.success("Category deleted");
      if (onDelete) onDelete();
      else onBack();
    } catch (err) {
      toast.error("Failed to delete category");
    }
  };

  if (loading) {
    return (
      <div className="pb-10 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 font-bold text-xs rounded-lg border border-gray-300 dark:border-zinc-700 shadow-sm transition-colors">
            <ArrowLeft size={16} /> Back to Categories
          </button>
          <span className="text-gray-400">/</span>
          <span className="text-xs font-mono font-bold text-gray-500">Loading Category...</span>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-12 shadow-sm flex flex-col items-center justify-center min-h-[350px] gap-3">
          <Loader2 size={32} className="animate-spin text-fire" />
          <p className="text-sm font-bold text-gray-700 dark:text-zinc-300">Loading collection specifications & assigned products...</p>
        </div>
      </div>
    );
  }

  const assignedProducts = categoryData?.products || [];
  const stats = categoryData?.stats || {
    product_count: assignedProducts.length,
    total_stock: assignedProducts.reduce((acc, p) => acc + (p.sizes?.reduce((sAcc, s) => sAcc + s.stock, 0) || 0), 0),
    min_price: assignedProducts.length ? Math.min(...assignedProducts.map(p => p.base_price || 0)) : 0,
    max_price: assignedProducts.length ? Math.max(...assignedProducts.map(p => p.base_price || 0)) : 0,
  };

  const parentCat = existingCategories.find(c => c.id === form.parent_id);

  return (
    <div className="pb-12 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-150">
      
      {/* Top Header & Breadcrumb Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-900 dark:text-zinc-100 font-bold text-xs rounded-xl border border-gray-300 dark:border-zinc-700 shadow-sm transition-all hover:-translate-x-0.5"
          >
            <ArrowLeft size={16} /> Back to Categories
          </button>
          <span className="text-gray-300 dark:text-zinc-700 text-sm hidden sm:inline">/</span>
          <span className="text-xs font-mono font-bold text-gray-500 dark:text-zinc-400 hidden sm:inline">Categories</span>
          <span className="text-gray-300 dark:text-zinc-700 text-sm hidden sm:inline">/</span>
          <span className="text-xs font-mono font-black text-gray-900 dark:text-zinc-100 hidden sm:inline truncate max-w-[220px]">
            {isNew ? "New Category" : (form.name || "Untitled")}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Active / Hidden Status Switcher */}
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-800/80 p-1 pl-3 pr-2 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-sm">
            <span className={`w-2 h-2 rounded-full ${form.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
            <select
              value={form.is_active ? "active" : "hidden"}
              onChange={(e) => setForm({ ...form, is_active: e.target.value === "active" })}
              className="bg-transparent text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
            >
              <option value="active" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100">Storefront Active</option>
              <option value="hidden" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100">Hidden / Draft</option>
            </select>
          </div>

          {!isNew && (
            <>
              <a
                href={`/collections/${form.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 font-bold text-xs rounded-xl border border-gray-200 dark:border-zinc-700 shadow-sm transition-colors"
              >
                <ExternalLink size={14} /> Storefront
              </a>
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-xs rounded-xl border border-rose-200 dark:border-rose-900 shadow-sm transition-colors"
              >
                <Trash2 size={14} /> Delete
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-fire hover:bg-fire-hover text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-sm hover:shadow-fire/20 transition-all flex items-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {isNew ? "Create Category" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* High-Impact 4-Metric Commercial Ribbon */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-gray-500 dark:text-zinc-400 font-bold uppercase text-[10px] tracking-wider block">Assigned Sneaker Drops</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="font-mono text-xl font-black text-gray-900 dark:text-zinc-100">
              {stats.product_count}
            </span>
            <span className="text-xs font-bold text-gray-500 dark:text-zinc-400">silhouettes</span>
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5 inline-block">
            Tagged with /{form.slug || 'slug'}
          </span>
        </div>

        <div>
          <span className="text-gray-500 dark:text-zinc-400 font-bold uppercase text-[10px] tracking-wider block">Warehouse Stock Depth</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="font-mono text-xl font-black text-gray-900 dark:text-zinc-100">
              {stats.total_stock}
            </span>
            <span className="text-xs font-bold text-gray-500 dark:text-zinc-400">pairs in inventory</span>
          </div>
          <span className="text-[10px] text-gray-400 mt-0.5 inline-block">
            Across all assigned shoe sizes
          </span>
        </div>

        <div>
          <span className="text-gray-500 dark:text-zinc-400 font-bold uppercase text-[10px] tracking-wider block">Price Spectrum</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-mono text-base font-bold text-gray-900 dark:text-zinc-100">
              {stats.min_price ? fmt(stats.min_price) : 'Rs. 0'}
            </span>
            <span className="text-gray-400 text-xs">–</span>
            <span className="font-mono text-base font-bold text-gray-900 dark:text-zinc-100">
              {stats.max_price ? fmt(stats.max_price) : 'Rs. 0'}
            </span>
          </div>
          <span className="text-[10px] text-gray-400 mt-0.5 inline-block">
            Base retail price bounds
          </span>
        </div>

        <div>
          <span className="text-gray-500 dark:text-zinc-400 font-bold uppercase text-[10px] tracking-wider block">Hierarchy & Status</span>
          <div className="mt-1">
            <span className="font-bold text-gray-900 dark:text-zinc-100 block text-sm">
              {parentCat ? `Sub of ${parentCat.name}` : 'Root Level Collection'}
            </span>
            <span className="text-[10px] font-mono text-fire mt-0.5 block">
              /collections/{form.slug || 'slug'}
            </span>
          </div>
        </div>
      </div>

      {/* Two-Column Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (7 cols): Visual Studio & Identity */}
        <div className="lg:col-span-7 space-y-6">

          {/* Section 1: Hero Media Studio */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
              <h2 className="font-display font-bold uppercase tracking-wider text-xs text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                <ImageIcon size={16} className="text-fire" /> Collection Hero Studio (Banner & Video)
              </h2>
              <span className="text-[10px] text-gray-400">Displayed at top of collection page</span>
            </div>

            {/* Banner Preview Area */}
            <div className="relative aspect-[16/8] bg-gray-50 dark:bg-zinc-800 rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-700 group">
              {form.hero_banner_url ? (
                <>
                  <img src={form.hero_banner_url} alt="Category Banner" className="w-full h-full object-cover object-center" />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                    <span className="font-display text-white text-lg font-black uppercase tracking-tight">
                      {form.name || "Collection Preview"}
                    </span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-gray-400 dark:text-zinc-500">
                  <ImageIcon size={36} className="mb-2 opacity-50 text-fire" />
                  <p className="font-bold text-xs text-gray-600 dark:text-zinc-400">No Hero Banner Uploaded</p>
                  <p className="text-[10px] text-gray-400">Upload an editorial banner photo (1200x500 recommended)</p>
                </div>
              )}
            </div>

            {/* Banner Upload Controls */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <label className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 dark:bg-zinc-800 hover:bg-fire text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-sm shrink-0">
                <Upload size={14} />
                <span>Upload Banner</span>
                <input type="file" accept="image/*" onChange={handleUploadBanner} className="hidden" />
              </label>
              <input
                type="url"
                placeholder="Or paste direct image URL (https://...)..."
                value={form.hero_banner_url}
                onChange={(e) => setForm({ ...form, hero_banner_url: e.target.value })}
                className="flex-1 px-3.5 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-zinc-100 placeholder-gray-400 focus:outline-none focus:border-fire font-mono"
              />
            </div>

            {/* Background Video URL */}
            <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 space-y-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Video size={14} className="text-fire" /> Background Video URL (Optional MP4)
              </label>
              <input
                type="url"
                placeholder="https://.../video.mp4"
                value={form.hero_video_url}
                onChange={(e) => setForm({ ...form, hero_video_url: e.target.value })}
                className="w-full px-3.5 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-zinc-100 placeholder-gray-400 focus:outline-none focus:border-fire font-mono"
              />
              {form.hero_video_url && (
                <div className="relative aspect-[16/7] rounded-xl overflow-hidden bg-black mt-2 border border-gray-200 dark:border-zinc-700">
                  <video src={form.hero_video_url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 left-2 bg-black/70 text-white font-mono text-[9px] px-2 py-0.5 rounded">
                    Live Video Preview
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Identity & Taxonomy */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="font-display font-bold uppercase tracking-wider text-xs text-gray-900 dark:text-zinc-100 border-b border-gray-100 dark:border-zinc-800 pb-3 flex items-center gap-2">
              <Tag size={16} className="text-fire" /> Category Identity & Hierarchy
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Retro Highs & Classics"
                    value={form.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm(prev => ({
                        ...prev,
                        name: val,
                        ...(isNew ? { slug: val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") } : {})
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-gray-900 dark:text-zinc-100 placeholder-gray-400 focus:outline-none focus:border-fire"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                    URL Slug Handle *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs">/collections/</span>
                    <input
                      type="text"
                      required
                      placeholder="retro-highs"
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "") })}
                      className="w-full pl-28 pr-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl font-mono text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-fire"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                  Parent Hierarchy Level
                </label>
                <select
                  value={form.parent_id}
                  onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-fire cursor-pointer"
                >
                  <option value="">-- Top Level / Root Category --</option>
                  {existingCategories.filter(c => c.id !== categoryId).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                  Collection Editorial Story & Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe this silhouette category, the craftsmanship, materials, street heritage, and style guidance for customers..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full p-3.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-zinc-100 placeholder-gray-400 focus:outline-none focus:border-fire leading-relaxed"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (5 cols): Assigned Products & SEO */}
        <div className="lg:col-span-5 space-y-6">

          {/* Section 1: Assigned Sneaker Drops Bench */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
              <h2 className="font-display font-bold uppercase tracking-wider text-xs text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                <Package size={16} className="text-fire" /> Assigned Sneakers ({assignedProducts.length})
              </h2>
              <span className="text-[10px] text-gray-400">Tagged with category slug</span>
            </div>

            {assignedProducts.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-gray-200 dark:border-zinc-800 rounded-xl space-y-2">
                <Package size={28} className="mx-auto text-gray-400 opacity-50" />
                <p className="font-bold text-xs text-gray-700 dark:text-zinc-300">No sneakers assigned yet</p>
                <p className="text-[11px] text-gray-400">
                  When creating or editing a sneaker in Products, select "{form.name || 'this category'}" as its category.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-zinc-800/60 max-h-[380px] overflow-y-auto pr-1">
                {assignedProducts.map(p => {
                  const stock = p.sizes?.reduce((acc, s) => acc + s.stock, 0) || 0;
                  return (
                    <div key={p.id} className="py-2.5 flex items-center justify-between gap-3 text-xs group">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={p.images?.[0] || 'https://via.placeholder.com/60'}
                          alt=""
                          className="w-10 h-10 object-cover rounded-lg border border-gray-200 dark:border-zinc-700 shrink-0 bg-gray-100"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 dark:text-zinc-100 truncate group-hover:text-fire transition-colors">
                            {p.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono font-bold text-gray-600 dark:text-zinc-400 text-[11px]">
                              {fmt(p.base_price)}
                            </span>
                            <span className="text-gray-300 dark:text-zinc-700">•</span>
                            <span className={`text-[10px] font-mono ${stock === 0 ? 'text-rose-500 font-bold' : 'text-gray-400'}`}>
                              {stock} pairs
                            </span>
                          </div>
                        </div>
                      </div>

                      <a
                        href={`?tab=products&productId=${p.id}`}
                        className="p-1.5 text-gray-400 hover:text-fire hover:bg-fire/10 rounded-lg transition-colors shrink-0"
                        title="Edit Sneaker Drop"
                      >
                        <ChevronRight size={16} />
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: SEO & Google SERP Snippet Preview */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="font-display font-bold uppercase tracking-wider text-xs text-gray-900 dark:text-zinc-100 border-b border-gray-100 dark:border-zinc-800 pb-3 flex items-center justify-between">
              <span className="flex items-center gap-2"><Globe size={16} className="text-fire" /> SEO & Google SERP Preview</span>
              <span className="text-[10px] text-gray-400 font-mono">Organic Search</span>
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                  Meta Title (SEO)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Retro Highs & Classic Sneakers | SOLEKICKS PK"
                  value={form.seo_title}
                  onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-zinc-100 placeholder-gray-400 focus:outline-none focus:border-fire"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                  Meta Description (SEO)
                </label>
                <textarea
                  rows={2}
                  placeholder="Explore Pakistan's most sought-after retro high-tops, verified authentic with nationwide express delivery..."
                  value={form.seo_description}
                  onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
                  className="w-full p-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-zinc-100 placeholder-gray-400 focus:outline-none focus:border-fire leading-relaxed"
                />
              </div>

              {/* Simulated Google Search Result */}
              <div className="p-4 bg-gray-50 dark:bg-zinc-800/60 rounded-xl border border-gray-200 dark:border-zinc-700/60 space-y-1">
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">Google Search Preview</span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block font-mono truncate">
                  https://solekicks.pk › collections › {form.slug || 'category'}
                </span>
                <p className="text-sm font-bold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer line-clamp-1">
                  {form.seo_title || `${form.name || 'Sneaker Collection'} | SOLEKICKS Pakistan`}
                </p>
                <p className="text-xs text-gray-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                  {form.seo_description || form.description || `Explore authentic ${form.name || 'sneakers'} at SOLEKICKS PK. Cash on Delivery across Karachi, Lahore, Islamabad, and nationwide.`}
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
