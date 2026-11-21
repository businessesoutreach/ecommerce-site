import React, { useState, useEffect } from 'react';
import { http, imgUrl } from '../../lib/api';
import { toast } from "sonner";
import { Trash2, Upload, Tag, Plus, Edit2, Check, X, Loader2, Image as ImageIcon, Video, Search } from 'lucide-react';

async function uploadCategoryPhoto(file) {
  const fd = new FormData();
  fd.append("file", file);
  const { data } = await http.post("/admin/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
  return data?.data?.url || data?.url;
}

export default function CategoriesCMS() {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    hero_banner_url: "",
    hero_video_url: "",
    seo_title: "",
    seo_description: "",
    parent_id: ""
  });

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

  const handleUploadBanner = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadCategoryPhoto(file);
      if (url) {
        setForm(prev => ({ ...prev, hero_banner_url: url }));
        toast.success("Banner photo uploaded");
      }
    } catch {
      toast.error("Upload failed");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Category name is required");

    setSaving(true);
    const cleanSlug = form.slug.trim() || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const payload = {
      ...form,
      name: form.name.trim(),
      slug: cleanSlug,
      parent_id: form.parent_id || null,
      sort_order: cats.length,
    };

    try {
      if (editingId) {
        await http.patch(`/admin/categories/${editingId}`, payload);
        toast.success("Category updated successfully");
      } else {
        await http.post("/admin/categories", payload);
        toast.success("Category created successfully");
      }
      setForm({ name: "", slug: "", description: "", hero_banner_url: "", hero_video_url: "", seo_title: "", seo_description: "", parent_id: "" });
      setEditingId(null);
      setShowAddForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setForm({
      name: c.name || "",
      slug: c.slug || "",
      description: c.description || "",
      hero_banner_url: c.hero_banner_url || "",
      hero_video_url: c.hero_video_url || "",
      seo_title: c.seo_title || "",
      seo_description: c.seo_description || "",
      parent_id: c.parent_id || ""
    });
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-150">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display tracking-tight text-2xl font-black text-gray-900 dark:text-zinc-100 flex items-center gap-3">
            Product Categories
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-fire/10 text-fire border border-fire/20">
              {cats.length} Categories
            </span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Configure dynamic product categories, taxonomy hierarchy, storefront collections, and SEO metadata.
          </p>
        </div>
        <button
          onClick={() => {
            if (showAddForm && !editingId) {
              setShowAddForm(false);
            } else {
              setEditingId(null);
              setForm({ name: "", slug: "", description: "", hero_banner_url: "", hero_video_url: "", seo_title: "", seo_description: "", parent_id: "" });
              setShowAddForm(true);
            }
          }}
          className="px-4 py-2 bg-fire hover:bg-fire-hover text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-2 shrink-0"
        >
          {showAddForm ? <X size={15} /> : <Plus size={15} />}
          <span>{showAddForm ? (editingId ? "Cancel Edit" : "Close Form") : "Add New Category"}</span>
        </button>
      </div>

      {/* Add / Edit Form Card */}
      {showAddForm && (
        <form onSubmit={handleSave} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
            <h2 className="font-display font-bold uppercase tracking-wider text-xs text-gray-900 dark:text-zinc-100 flex items-center gap-2">
              <Tag size={16} className="text-fire" />
              {editingId ? "Edit Category Specification" : "Create New Product Category"}
            </h2>
            <span className="text-[10px] text-gray-400">Fields marked * are required</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Banner Photo Upload */}
            <div className="md:col-span-4 space-y-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300">
                Category Hero Banner
              </label>
              <div className="relative aspect-[16/10] bg-gray-50 dark:bg-zinc-800/80 rounded-xl border-2 border-dashed border-gray-200 dark:border-zinc-700 flex flex-col items-center justify-center overflow-hidden group">
                {form.hero_banner_url ? (
                  <>
                    <img src={form.hero_banner_url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-white text-xs font-bold">Change Banner</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <ImageIcon size={28} className="mx-auto text-gray-400 dark:text-zinc-500 mb-1" />
                    <span className="text-xs font-bold text-gray-600 dark:text-zinc-400 block">Upload Banner</span>
                    <span className="text-[10px] text-gray-400 dark:text-zinc-500">JPG, PNG, or WebP</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadBanner}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              <input
                type="url"
                placeholder="Or paste banner image URL..."
                value={form.hero_banner_url}
                onChange={(e) => setForm({ ...form, hero_banner_url: e.target.value })}
                className="w-full px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-zinc-100 placeholder-gray-400 focus:outline-none focus:border-fire"
              />
            </div>

            {/* General Fields */}
            <div className="md:col-span-8 space-y-4">
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
                        ...(!editingId ? { slug: val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") } : {})
                      }));
                    }}
                    className="w-full px-3.5 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-gray-900 dark:text-zinc-100 placeholder-gray-400 focus:outline-none focus:border-fire"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                    URL Slug *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs">/collections/</span>
                    <input
                      type="text"
                      required
                      placeholder="retro-highs"
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "") })}
                      className="w-full pl-28 pr-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl font-mono text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-fire"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                    Parent Hierarchy
                  </label>
                  <select
                    value={form.parent_id}
                    onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-fire cursor-pointer"
                  >
                    <option value="">-- Top Level Category --</option>
                    {cats.filter(c => c.id !== editingId).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                    Background Video URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://... (.mp4)"
                    value={form.hero_video_url}
                    onChange={(e) => setForm({ ...form, hero_video_url: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-zinc-100 placeholder-gray-400 focus:outline-none focus:border-fire font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                  Description / Merchandising Story
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe this sneaker collection for customers and search engines..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-zinc-100 placeholder-gray-400 focus:outline-none focus:border-fire leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => { setShowAddForm(false); setEditingId(null); }}
                  className="px-4 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-fire hover:bg-fire-hover text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>{editingId ? "Update Category" : "Save Category"}</span>
                </button>
              </div>
            </div>

          </div>
        </form>
      )}

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
                  <th className="p-3.5 pl-5">Cover / Banner</th>
                  <th className="p-3.5">Category Name</th>
                  <th className="p-3.5">Slug Handle</th>
                  <th className="p-3.5">Hierarchy</th>
                  <th className="p-3.5 text-right pr-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60">
                {filteredCats.map(c => {
                  const parent = cats.find(p => p.id === c.parent_id);
                  return (
                    <tr key={c.id} className="hover:bg-gray-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="p-3.5 pl-5">
                        {c.hero_banner_url ? (
                          <img src={c.hero_banner_url} alt="" className="w-14 h-10 object-cover rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-100" />
                        ) : (
                          <div className="w-14 h-10 rounded-lg bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 grid place-items-center text-gray-400 text-[10px] font-bold">
                            NO IMG
                          </div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-sm text-gray-900 dark:text-zinc-100 block">
                          {c.name}
                        </span>
                        {c.description && (
                          <span className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                            {c.description}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-xs text-fire">
                        /collections/{c.slug}
                      </td>
                      <td className="p-3.5">
                        {parent ? (
                          <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-bold text-[10px]">
                            {parent.name}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[11px]">Root</span>
                        )}
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => startEdit(c)}
                            className="p-1.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 rounded-lg transition-colors"
                            title="Edit Category"
                          >
                            <Edit2 size={13} />
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
