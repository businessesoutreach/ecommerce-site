import React, { useState, useEffect } from 'react';
import { http, imgUrl } from '../../lib/api';
import { toast } from "sonner";
import { Trash2, Upload } from 'lucide-react';

async function uploadImage(file) {
  const fd = new FormData();
  fd.append("file", file);
  const { data } = await http.post("/admin/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
  return imgUrl(data.data.url);
}

function ImageInput({ value, onChange }) {
  const [busy, setBusy] = useState(false);
  const handle = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try { onChange(await uploadImage(file)); toast.success("Image uploaded"); }
    catch { toast.error("Upload failed"); }
    setBusy(false);
  };
  return (
    <div className="border-2 border-dashed border-ink-200 bg-ink-50 p-4 flex flex-col items-center justify-center relative hover:bg-ink-100 transition-colors h-full min-h-[100px]">
      {busy ? (
        <span className="text-ink-500 font-bold text-sm animate-pulse">Uploading...</span>
      ) : value ? (
        <img src={value} alt="" className="h-full object-contain" />
      ) : (
        <div className="text-ink-400 flex flex-col items-center">
          <Upload size={18} className="mb-1" />
          <span className="text-xs font-bold">Upload Image</span>
        </div>
      )}
      <input type="file" onChange={handle} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
    </div>
  );
}

export default function CategoriesCMS() {
  const [cats, setCats] = useState([]);
  const [f, setF] = useState({ name: "", slug: "", description: "", hero_banner_url: "", hero_video_url: "", seo_title: "", seo_description: "", parent_id: "" });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await http.get("/admin/categories");
      setCats(data.data);
    } catch (err) { toast.error("Failed to load categories"); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!f.name) return toast.error("Name required");
    try {
      await http.post("/admin/categories", { 
        ...f, 
        sort_order: cats.length,
        parent_id: f.parent_id || null 
      });
      toast.success("Category added"); 
      setF({ name: "", slug: "", description: "", hero_banner_url: "", hero_video_url: "", seo_title: "", seo_description: "", parent_id: "" }); 
      load();
    } catch (err) {
      toast.error("Failed to add category");
    }
  };

  const del = async (id) => { 
    if(!window.confirm("Delete this category?")) return;
    try {
      await http.delete(`/admin/categories/${id}`); 
      toast.success("Category deleted");
      load(); 
    } catch (err) {
      toast.error("Failed to delete category");
    }
  };

  if (loading) return <div className="p-10 text-center text-ink-500">Loading...</div>;

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h2 className="text-2xl font-display font-bold text-obsidian tracking-tight">Categories</h2>
        <p className="text-ink-500 mt-1">Manage product categories and collections.</p>
      </div>

      <div className="bg-white border border-ink-200 p-6 mb-10 shadow-sm">
        <h3 className="font-display font-bold text-obsidian mb-4">Add Category</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="col-span-1">
             <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">Category Banner</label>
             <div className="h-32">
               <ImageInput value={f.hero_banner_url} onChange={(v) => setF({ ...f, hero_banner_url: v })} />
             </div>
          </div>
          
          <div className="col-span-1 md:col-span-3 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">Name *</label>
                <input placeholder="E.g. Retro High" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="w-full border border-ink-200 px-4 py-2 outline-none focus:border-obsidian" />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">Slug</label>
                <input placeholder="E.g. retro-high" value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} className="w-full border border-ink-200 px-4 py-2 outline-none focus:border-obsidian" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">Parent Category</label>
                <select value={f.parent_id} onChange={(e) => setF({ ...f, parent_id: e.target.value })} className="w-full border border-ink-200 px-4 py-2 outline-none focus:border-obsidian bg-white">
                  <option value="">-- Top Level --</option>
                  {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">Background Video URL</label>
                <input placeholder="https://... (.mp4)" value={f.hero_video_url} onChange={(e) => setF({ ...f, hero_video_url: e.target.value })} className="w-full border border-ink-200 px-4 py-2 outline-none focus:border-obsidian" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">Description</label>
              <textarea placeholder="Category description..." value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={2} className="w-full border border-ink-200 px-4 py-2 outline-none focus:border-obsidian" />
            </div>

            <div className="border-t border-ink-100 pt-4 mt-2">
              <h4 className="text-sm font-bold text-obsidian mb-3">SEO</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">SEO Title</label>
                  <input placeholder="Meta Title" value={f.seo_title} onChange={(e) => setF({ ...f, seo_title: e.target.value })} className="w-full border border-ink-200 px-4 py-2 outline-none focus:border-obsidian" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">SEO Description</label>
                  <input placeholder="Meta Description" value={f.seo_description} onChange={(e) => setF({ ...f, seo_description: e.target.value })} className="w-full border border-ink-200 px-4 py-2 outline-none focus:border-obsidian" />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button onClick={add} className="bg-obsidian text-white font-bold px-6 py-2.5 hover:bg-fire transition-colors">Add Category</button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-ink-200 rounded-none overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-ink-50 border-b border-ink-200 text-xs uppercase tracking-wider text-ink-500">
            <tr>
              <th className="p-4 font-bold">Image</th>
              <th className="p-4 font-bold">Category</th>
              <th className="p-4 font-bold">Slug</th>
              <th className="p-4 font-bold">Parent</th>
              <th className="p-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {cats.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-ink-500">No categories found.</td></tr>
            ) : (
              cats.map(c => {
                const parent = cats.find(p => p.id === c.parent_id);
                return (
                  <tr key={c.id} className="hover:bg-ink-50/50 transition-colors">
                    <td className="p-4">
                      {c.hero_banner_url ? (
                        <img src={c.hero_banner_url} alt="" className="w-12 h-12 object-cover border border-ink-200 bg-ink-100" />
                      ) : (
                        <div className="w-12 h-12 bg-ink-100 border border-ink-200 flex items-center justify-center text-ink-400 text-xs">IMG</div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-obsidian">{c.name}</div>
                      {c.hero_video_url && <span className="text-[10px] bg-fire/10 text-fire px-2 py-0.5 rounded font-bold uppercase mt-1 inline-block">Has Video</span>}
                    </td>
                    <td className="p-4 text-sm text-ink-600 font-mono">/{c.slug}</td>
                    <td className="p-4 text-sm text-ink-500">{parent ? parent.name : '-'}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => del(c.id)} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
