import React, { useState, useEffect } from 'react';
import { http } from '../../lib/api';
import { toast } from "sonner";
import { Trash2, Upload, Box, Plus, Edit2, Check, X, Loader2, Image as ImageIcon, Search } from 'lucide-react';

async function uploadBrandLogo(file) {
  const fd = new FormData();
  fd.append("file", file);
  const { data } = await http.post("/admin/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
  return data?.data?.url || data?.url;
}

export default function BrandsCMS() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    name: "",
    slug: "",
    image_url: ""
  });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await http.get("/admin/brands");
      setBrands(data.data || []);
    } catch (err) {
      toast.error("Failed to load brands");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleUploadLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadBrandLogo(file);
      if (url) {
        setForm(prev => ({ ...prev, image_url: url }));
        toast.success("Brand logo uploaded");
      }
    } catch {
      toast.error("Logo upload failed");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Brand name is required");

    setSaving(true);
    const cleanSlug = form.slug.trim() || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const payload = {
      name: form.name.trim(),
      slug: cleanSlug,
      image_url: form.image_url || null,
    };

    try {
      if (editingId) {
        await http.patch(`/admin/brands/${editingId}`, payload);
        toast.success("Brand updated successfully");
      } else {
        await http.post("/admin/brands", payload);
        toast.success("Brand created successfully");
      }
      setForm({ name: "", slug: "", image_url: "" });
      setEditingId(null);
      setShowAddForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save brand");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (b) => {
    setEditingId(b.id);
    setForm({
      name: b.name || "",
      slug: b.slug || "",
      image_url: b.image_url || ""
    });
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const del = async (id, name) => {
    if (!window.confirm(`Delete brand "${name}"? Existing sneaker records will keep their reference.`)) return;
    try {
      await http.delete(`/admin/brands/${id}`);
      toast.success("Brand deleted");
      load();
    } catch (err) {
      toast.error("Failed to delete brand");
    }
  };

  const filteredBrands = brands.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) || 
    b.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-150">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display tracking-tight text-2xl font-black text-gray-900 dark:text-zinc-100 flex items-center gap-3">
            Brands & Silhouettes
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-fire/10 text-fire border border-fire/20">
              {brands.length} Brands
            </span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Configure dynamic sneaker brand manufacturers (Nike, Jordan, Yeezy, New Balance, AirVault, etc.).
          </p>
        </div>
        <button
          onClick={() => {
            if (showAddForm && !editingId) {
              setShowAddForm(false);
            } else {
              setEditingId(null);
              setForm({ name: "", slug: "", image_url: "" });
              setShowAddForm(true);
            }
          }}
          className="px-4 py-2 bg-fire hover:bg-fire-hover text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-2 shrink-0"
        >
          {showAddForm ? <X size={15} /> : <Plus size={15} />}
          <span>{showAddForm ? (editingId ? "Cancel Edit" : "Close Form") : "Add New Brand"}</span>
        </button>
      </div>

      {/* Add / Edit Form Card */}
      {showAddForm && (
        <form onSubmit={handleSave} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
            <h2 className="font-display font-bold uppercase tracking-wider text-xs text-gray-900 dark:text-zinc-100 flex items-center gap-2">
              <Box size={16} className="text-fire" />
              {editingId ? "Edit Brand Details" : "Register New Sneaker Brand"}
            </h2>
            <span className="text-[10px] text-gray-400">Fields marked * are required</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Logo Upload */}
            <div className="md:col-span-4 space-y-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300">
                Brand Logo / Emblem
              </label>
              <div className="relative aspect-square max-w-[200px] mx-auto bg-gray-50 dark:bg-zinc-800/80 rounded-2xl border-2 border-dashed border-gray-200 dark:border-zinc-700 flex flex-col items-center justify-center overflow-hidden group">
                {form.image_url ? (
                  <>
                    <img src={form.image_url} alt="" className="w-full h-full object-contain p-4" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-white text-xs font-bold">Change Logo</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <ImageIcon size={28} className="mx-auto text-gray-400 dark:text-zinc-500 mb-1" />
                    <span className="text-xs font-bold text-gray-600 dark:text-zinc-400 block">Upload Logo</span>
                    <span className="text-[10px] text-gray-400 dark:text-zinc-500">PNG, SVG, or JPG</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadLogo}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              <input
                type="url"
                placeholder="Or paste logo image URL..."
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                className="w-full px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-zinc-100 placeholder-gray-400 focus:outline-none focus:border-fire"
              />
            </div>

            {/* General Fields */}
            <div className="md:col-span-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jordan Brand, Nike, Yeezy, New Balance"
                    value={form.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm(prev => ({
                        ...prev,
                        name: val,
                        ...(!editingId ? { slug: val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") } : {})
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-gray-900 dark:text-zinc-100 placeholder-gray-400 focus:outline-none focus:border-fire"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                    Brand Slug / Identifier *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="jordan, nike, yeezy"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "") })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl font-mono text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-fire"
                  />
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-200 dark:border-zinc-700/60 text-xs text-gray-600 dark:text-zinc-400 space-y-1">
                <p className="font-bold text-gray-800 dark:text-zinc-200">ℹ️ Automatic App Integration</p>
                <p>
                  Once added, this brand will immediately be selectable in Product Creation, Inventory Management, Storefront Filters, and Search Facets across the entire website.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-zinc-800">
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
                  <span>{editingId ? "Update Brand" : "Save Brand"}</span>
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
            placeholder="Search brands by name or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-zinc-100 placeholder-gray-400 focus:outline-none focus:border-fire"
          />
        </div>
        <span className="text-xs font-mono font-bold text-gray-400">
          Showing {filteredBrands.length} of {brands.length}
        </span>
      </div>

      {/* Brands Table */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-2">
            <Loader2 size={28} className="animate-spin text-fire" />
            <p className="text-xs font-bold text-gray-500">Loading brands...</p>
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Box size={32} className="mx-auto mb-2 opacity-40" />
            <p className="font-bold text-sm">No brands found</p>
            <p className="text-xs mt-1">Click "Add New Brand" above to register your first brand.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50/80 dark:bg-zinc-800/60 font-mono text-[10px] uppercase tracking-wider text-gray-500 dark:text-zinc-400 border-b border-gray-200 dark:border-zinc-800">
                <tr>
                  <th className="p-3.5 pl-5 w-20">Logo</th>
                  <th className="p-3.5">Brand Name</th>
                  <th className="p-3.5">Slug Handle</th>
                  <th className="p-3.5 text-right pr-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60">
                {filteredBrands.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="p-3.5 pl-5">
                      {b.image_url ? (
                        <img src={b.image_url} alt="" className="w-12 h-12 object-contain p-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 grid place-items-center text-gray-400 font-bold text-[10px]">
                          LOGO
                        </div>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-sm text-gray-900 dark:text-zinc-100 block">
                        {b.name}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-xs text-fire">
                      {b.slug}
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => startEdit(b)}
                          className="p-1.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 rounded-lg transition-colors"
                          title="Edit Brand"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => del(b.id, b.name)}
                          className="p-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-400 rounded-lg transition-colors"
                          title="Delete Brand"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
