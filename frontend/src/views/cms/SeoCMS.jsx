import React, { useState, useEffect } from 'react';
import { http, imgUrl } from '../../lib/api';
import { toast } from "sonner";
import { Upload } from 'lucide-react';

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
    <div className="border-2 border-dashed border-ink-200 bg-ink-50 p-4 flex flex-col items-center justify-center relative hover:bg-ink-100 transition-colors h-full min-h-[120px]">
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

export default function SeoCMS() {
  const [f, setF] = useState({ default_meta_title: "", default_meta_desc: "", default_og_image: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const { data } = await http.get("/admin/cms/seo");
      setF({
        default_meta_title: data.data.default_meta_title || "",
        default_meta_desc: data.data.default_meta_desc || "",
        default_og_image: data.data.default_og_image || ""
      });
    } catch (err) { toast.error("Failed to load SEO config"); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      await http.patch("/admin/cms/seo", f);
      toast.success("SEO Configuration saved");
    } catch (err) {
      toast.error("Failed to save SEO config");
    }
    setSaving(false);
  };

  if (loading) return <div className="p-10 text-center text-ink-500">Loading...</div>;

  return (
    <div className="max-w-3xl">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-display font-bold text-obsidian tracking-tight">Global SEO</h2>
          <p className="text-ink-500 mt-1">Manage global search engine optimization defaults.</p>
        </div>
      </div>

      <div className="bg-white border border-ink-200 p-6 shadow-sm">
        <h3 className="font-display font-bold text-obsidian mb-6 pb-4 border-b border-ink-100">Storefront Metadata</h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-ink-500  tracking-wider mb-2">Default Meta Title</label>
            <p className="text-xs text-ink-400 mb-2">Appears in browser tabs and search engine results when a specific page title is not set.</p>
            <input placeholder="E.g. Premium Sneakers & Streetwear | Solekicks" value={f.default_meta_title} onChange={(e) => setF({ ...f, default_meta_title: e.target.value })} className="w-full border border-ink-200 px-4 py-2 outline-none focus:border-obsidian font-mono text-sm" />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-ink-500  tracking-wider mb-2">Default Meta Description</label>
            <p className="text-xs text-ink-400 mb-2">A short summary of your store. Keep it under 160 characters for best results.</p>
            <textarea placeholder="Shop the latest premium sneakers and streetwear..." value={f.default_meta_desc} onChange={(e) => setF({ ...f, default_meta_desc: e.target.value })} rows={3} className="w-full border border-ink-200 px-4 py-2 outline-none focus:border-obsidian font-mono text-sm" />
          </div>

          <div>
             <label className="block text-xs font-bold text-ink-500  tracking-wider mb-2">Default OpenGraph (OG) Image</label>
             <p className="text-xs text-ink-400 mb-2">The image that appears when your store link is shared on social media (Facebook, Twitter, WhatsApp).</p>
             <div className="h-40 w-full sm:w-1/2">
               <ImageInput value={f.default_og_image} onChange={(v) => setF({ ...f, default_og_image: v })} />
             </div>
          </div>

          <div className="pt-6 mt-6 border-t border-ink-100">
            <button onClick={save} disabled={saving} className="bg-obsidian text-white font-bold px-8 py-3 hover:bg-fire transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-ink-50 border border-ink-200 text-sm text-ink-600">
        <h4 className="font-bold mb-2">SEO Hierarchy</h4>
        <p>This global SEO configuration is used as a fallback. If a specific Category, Product, or Static Page has its own SEO tags defined, those will override these global settings.</p>
      </div>
    </div>
  );
}

