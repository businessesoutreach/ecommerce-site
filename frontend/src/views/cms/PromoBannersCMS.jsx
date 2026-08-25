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

export default function PromoBannersCMS() {
  const [banners, setBanners] = useState([]);
  const [f, setF] = useState({ title: "", subtitle: "", cta_text: "SHOP SALE", link: "/sale", image_url: "", start_date: "", end_date: "" });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await http.get("/admin/cms/promo-banners");
      setBanners(data.data);
    } catch (err) { toast.error("Failed to load banners"); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!f.image_url) return toast.error("Image required");
    try {
      await http.post("/admin/cms/promo-banners", {
        ...f,
        start_date: f.start_date ? new Date(f.start_date).toISOString() : null,
        end_date: f.end_date ? new Date(f.end_date).toISOString() : null
      });
      toast.success("Banner added"); 
      setF({ title: "", subtitle: "", cta_text: "SHOP SALE", link: "/sale", image_url: "", start_date: "", end_date: "" }); 
      load();
    } catch (err) {
      toast.error("Failed to add banner");
    }
  };

  const del = async (id) => { 
    if(!window.confirm("Delete this banner?")) return;
    try {
      await http.delete(`/admin/cms/promo-banners/${id}`); 
      toast.success("Banner deleted");
      load(); 
    } catch (err) {
      toast.error("Failed to delete banner");
    }
  };

  const toggleStatus = async (banner) => {
    try {
      await http.patch(`/admin/cms/promo-banners/${banner.id}`, { is_active: !banner.is_active });
      load();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  if (loading) return <div className="p-10 text-center text-ink-500">Loading...</div>;

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h2 className="text-2xl font-display font-bold text-obsidian tracking-tight">Promotional Banners</h2>
        <p className="text-ink-500 mt-1">Manage inline banners that appear between product sections.</p>
      </div>

      <div className="bg-white border border-ink-200 p-6 mb-10 shadow-sm">
        <h3 className="font-display font-bold text-obsidian mb-4">Add Banner</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1">
             <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">Banner Image *</label>
             <div className="h-48">
               <ImageInput value={f.image_url} onChange={(v) => setF({ ...f, image_url: v })} />
             </div>
          </div>
          
          <div className="col-span-1 md:col-span-2 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">Heading</label>
                <input placeholder="E.g. SUMMER SALE" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className="w-full border border-ink-200 px-4 py-2 outline-none focus:border-obsidian" />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">Subtitle</label>
                <input placeholder="E.g. Up to 40% Off" value={f.subtitle} onChange={(e) => setF({ ...f, subtitle: e.target.value })} className="w-full border border-ink-200 px-4 py-2 outline-none focus:border-obsidian" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">Button Text</label>
                <input placeholder="SHOP SALE" value={f.cta_text} onChange={(e) => setF({ ...f, cta_text: e.target.value })} className="w-full border border-ink-200 px-4 py-2 outline-none focus:border-obsidian" />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">Button URL</label>
                <input placeholder="/sale" value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} className="w-full border border-ink-200 px-4 py-2 outline-none focus:border-obsidian" />
              </div>
            </div>

            <div className="border-t border-ink-100 pt-4 mt-2">
              <h4 className="text-sm font-bold text-obsidian mb-3">Scheduling (Optional)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">Start Date</label>
                  <input type="datetime-local" value={f.start_date} onChange={(e) => setF({ ...f, start_date: e.target.value })} className="w-full border border-ink-200 px-4 py-2 outline-none focus:border-obsidian" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">End Date</label>
                  <input type="datetime-local" value={f.end_date} onChange={(e) => setF({ ...f, end_date: e.target.value })} className="w-full border border-ink-200 px-4 py-2 outline-none focus:border-obsidian" />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button onClick={add} className="bg-obsidian text-white font-bold px-6 py-2.5 hover:bg-fire transition-colors">Add Banner</button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-display font-bold text-obsidian">Current Banners</h3>
        {banners.length === 0 ? (
          <div className="p-8 text-center border border-ink-200 text-ink-500 bg-ink-50">No promotional banners found.</div>
        ) : (
          banners.map((b) => (
            <div key={b.id} className="flex border border-ink-200 bg-white shadow-sm overflow-hidden">
              <div className="w-64 bg-ink-100 relative">
                <img src={b.image_url} alt="" className="w-full h-full object-cover absolute inset-0" />
              </div>
              <div className="flex-1 p-5 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-display font-bold text-lg text-obsidian">{b.title || "Untitled Banner"}</h4>
                    {!b.is_active && <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5">INACTIVE</span>}
                  </div>
                  <p className="text-ink-500 text-sm mb-3">{b.subtitle || "No subtitle"}</p>
                  
                  <div className="flex items-center gap-4 text-xs font-bold text-ink-500">
                    <div><span className="text-ink-400">BTN:</span> {b.cta_text || '-'}</div>
                    <div><span className="text-ink-400">URL:</span> {b.link || '-'}</div>
                  </div>
                  
                  {(b.start_date || b.end_date) && (
                    <div className="mt-3 text-xs bg-blue-50 text-blue-800 px-3 py-1.5 inline-block">
                      Scheduled: {b.start_date ? new Date(b.start_date).toLocaleDateString() : 'Now'} &mdash; {b.end_date ? new Date(b.end_date).toLocaleDateString() : 'Forever'}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-2">
                  <button onClick={() => toggleStatus(b)} className={`px-4 py-1.5 text-xs font-bold border ${b.is_active ? 'border-ink-200 text-ink-600 hover:bg-ink-50' : 'border-green-600 bg-green-50 text-green-700 hover:bg-green-100'}`}>
                    {b.is_active ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => del(b.id)} className="px-4 py-1.5 text-xs font-bold border border-red-200 text-red-600 hover:bg-red-50 flex items-center justify-center gap-1">
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
