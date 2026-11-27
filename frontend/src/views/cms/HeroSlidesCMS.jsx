import React, { useState, useEffect } from 'react';
import { http, imgUrl } from '../../lib/api';
import { toast } from "sonner";
import ConfirmModal from '../../components/ConfirmModal';
import { Trash2, Upload, ArrowUp, ArrowDown, Pencil, X, Check } from 'lucide-react';

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
    <div className="border-2 border-dashed border-ink-200 bg-ink-50 p-4 flex flex-col items-center justify-center relative hover:bg-ink-100 transition-colors min-h-[120px]">
      {busy ? (
        <span className="text-ink-500 font-bold text-sm animate-pulse">Uploading...</span>
      ) : value ? (
        <img src={value} alt="" className="h-24 object-contain" />
      ) : (
        <div className="text-ink-400 flex flex-col items-center">
          <Upload size={24} className="mb-2" />
          <span className="text-sm font-bold">Upload Image</span>
        </div>
      )}
      <input type="file" onChange={handle} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
    </div>
  );
}

const EMPTY_FORM = {
  title: "",
  subtitle: "",
  button_text: "Shop Now",
  link: "/new-arrivals",
  image_url: "",
  start_date: "",
  end_date: ""
};

const toLocalInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export default function HeroSlidesCMS() {
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [f, setF] = useState(EMPTY_FORM);

  const load = async () => {
    try {
      const res = await http.get("/admin/hero-slides");
      setSlides(res.data.data || []);
    } catch { toast.error("Failed to load slides"); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!f.image_url) return toast.error("Image is required");
    const payload = {
      title: f.title,
      subtitle: f.subtitle,
      button_text: f.button_text,
      link: f.link,
      image_url: f.image_url,
      start_date: f.start_date ? new Date(f.start_date).toISOString() : null,
      end_date: f.end_date ? new Date(f.end_date).toISOString() : null
    };
    try {
      if (editingId) {
        await http.patch(`/admin/hero-slides/${editingId}`, payload);
        toast.success("Slide updated");
        setEditingId(null);
      } else {
        await http.post("/admin/hero-slides", { ...payload, sort_order: slides.length });
        toast.success("Slide added");
      }
      setF(EMPTY_FORM);
      load();
    } catch {
      toast.error(editingId ? "Failed to update slide" : "Failed to add slide");
    }
  };

  const startEdit = (slide) => {
    setEditingId(slide.id);
    setF({
      title: slide.title || "",
      subtitle: slide.subtitle || "",
      button_text: slide.button_text || "Shop Now",
      link: slide.link || "/new-arrivals",
      image_url: slide.image_url || "",
      start_date: toLocalInput(slide.start_date),
      end_date: toLocalInput(slide.end_date)
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setF(EMPTY_FORM);
  };

  const moveSlide = async (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= slides.length || reordering) return;

    const updated = [...slides];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);

    setSlides(updated);
    setReordering(true);
    try {
      const res = await http.patch("/admin/hero-slides/reorder", {
        ids: updated.map((s) => s.id)
      });
      if (res.data?.data) setSlides(res.data.data);
      toast.success("Slide order updated");
    } catch {
      toast.error("Failed to reorder slides");
      load();
    } finally {
      setReordering(false);
    }
  };

  const del = (id) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete this hero slide?",
      message: "Are you sure you want to remove this slide from the storefront homepage carousel?",
      confirmText: "Delete Slide",
      variant: "danger",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          await http.delete(`/admin/hero-slides/${id}`);
          toast.success("Slide deleted");
          setConfirmModal({ isOpen: false });
          if (editingId === id) cancelEdit();
          load();
        } catch {
          toast.error("Failed to delete slide");
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      }
    });
  };

  const toggleStatus = async (slide) => {
    try {
      await http.patch(`/admin/hero-slides/${slide.id}`, { is_active: !slide.is_active });
      load();
    } catch {
      toast.error("Failed to update status");
    }
  };

  if (loading) return <div className="p-10 text-center text-ink-500">Loading...</div>;

  return (
    <div className="max-w-4xl">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-display font-bold text-obsidian tracking-tight">Hero Slides</h2>
        <p className="text-ink-500 text-sm mt-1">Manage and reorder the rotating carousel on the homepage.</p>
      </div>

      <div className="bg-white border border-ink-200 p-4 sm:p-6 mb-8 sm:mb-10 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-obsidian">
            {editingId ? "Edit Slide" : "Add New Slide"}
          </h3>
          {editingId && (
            <button onClick={cancelEdit} className="inline-flex items-center gap-1 text-xs font-bold text-ink-500 hover:text-obsidian">
              <X size={14} /> Cancel Edit
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          <div className="col-span-1">
            <label className="block text-xs font-bold text-ink-500 tracking-wider mb-2">Slide Image *</label>
            <ImageInput value={f.image_url} onChange={(v) => setF({ ...f, image_url: v })} />
          </div>
          <div className="col-span-1 md:col-span-2 space-y-4">
            <div>
              <label className="block text-xs font-bold text-ink-500 tracking-wider mb-2">Heading</label>
              <input placeholder="E.g. STREET REVOLUTION" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className="w-full border border-ink-200 px-3 sm:px-4 py-2 text-sm outline-none focus:border-obsidian" />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-500 tracking-wider mb-2">Subtitle</label>
              <input placeholder="E.g. Discover the new collection" value={f.subtitle} onChange={(e) => setF({ ...f, subtitle: e.target.value })} className="w-full border border-ink-200 px-3 sm:px-4 py-2 text-sm outline-none focus:border-obsidian" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink-500 tracking-wider mb-2">Button Text</label>
                <input placeholder="Shop Now" value={f.button_text} onChange={(e) => setF({ ...f, button_text: e.target.value })} className="w-full border border-ink-200 px-3 sm:px-4 py-2 text-sm outline-none focus:border-obsidian" />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-500 tracking-wider mb-2">Button URL</label>
                <input placeholder="/collections/streetwear" value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} className="w-full border border-ink-200 px-3 sm:px-4 py-2 text-sm outline-none focus:border-obsidian" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-ink-100 pt-4 mt-2">
              <div>
                <label className="block text-xs font-bold text-ink-500 tracking-wider mb-2">Start Date (Optional)</label>
                <input type="datetime-local" value={f.start_date} onChange={(e) => setF({ ...f, start_date: e.target.value })} className="w-full border border-ink-200 px-3 sm:px-4 py-2 text-sm outline-none focus:border-obsidian" />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-500 tracking-wider mb-2">End Date (Optional)</label>
                <input type="datetime-local" value={f.end_date} onChange={(e) => setF({ ...f, end_date: e.target.value })} className="w-full border border-ink-200 px-3 sm:px-4 py-2 text-sm outline-none focus:border-obsidian" />
              </div>
            </div>
            <div className="pt-2 flex items-center gap-3">
              <button onClick={save} className="inline-flex items-center gap-2 bg-obsidian text-white font-bold text-sm px-6 py-2.5 hover:bg-fire transition-colors">
                {editingId ? <><Check size={15} /> Save Changes</> : "Add Slide"}
              </button>
              {editingId && (
                <button onClick={cancelEdit} className="border border-ink-200 text-ink-600 font-bold text-sm px-4 py-2.5 hover:bg-ink-50">
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-obsidian">Current Slides ({slides.length})</h3>
          <span className="text-xs text-ink-400">Use arrows to reorder slides</span>
        </div>
        {slides.length === 0 ? (
          <div className="p-8 text-center border border-ink-200 text-ink-500 bg-ink-50">No hero slides found.</div>
        ) : (
          slides.map((s, index) => (
            <div key={s.id} className="flex flex-col sm:flex-row border border-ink-200 bg-white shadow-sm overflow-hidden group">
              <div className="w-full sm:w-48 h-40 sm:h-auto bg-ink-100 relative shrink-0">
                <img src={s.image_url} alt={s.title || "Hero Slide"} className="w-full h-full object-cover absolute inset-0" />
                <span className="absolute top-2 left-2 bg-obsidian/85 text-white font-mono text-[10px] font-bold px-2 py-0.5">
                  #{index + 1}
                </span>
              </div>
              <div className="flex-1 p-4 sm:p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h4 className="font-display font-bold text-base sm:text-lg text-obsidian">{s.title || "Untitled Slide"}</h4>
                    {!s.is_active && <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5">INACTIVE</span>}
                  </div>
                  <p className="text-ink-500 text-xs sm:text-sm mb-3 line-clamp-2">{s.subtitle || "No subtitle"}</p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-ink-500">
                    <div><span className="text-ink-400">BTN:</span> {s.button_text || "Shop Now"}</div>
                    <div><span className="text-ink-400">URL:</span> {s.link || "/shop"}</div>
                  </div>

                  {(s.start_date || s.end_date) && (
                    <div className="mt-3 text-xs bg-blue-50 text-blue-800 px-3 py-1.5 inline-block">
                      Scheduled: {s.start_date ? new Date(s.start_date).toLocaleDateString() : 'Now'} &mdash; {s.end_date ? new Date(s.end_date).toLocaleDateString() : 'Forever'}
                    </div>
                  )}
                </div>

                <div className="flex sm:flex-col items-center sm:items-stretch gap-2 shrink-0">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveSlide(index, -1)}
                      disabled={index === 0 || reordering}
                      title="Move Up"
                      className="p-1.5 border border-ink-200 text-ink-600 hover:bg-ink-50 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      onClick={() => moveSlide(index, 1)}
                      disabled={index === slides.length - 1 || reordering}
                      title="Move Down"
                      className="p-1.5 border border-ink-200 text-ink-600 hover:bg-ink-50 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      onClick={() => startEdit(s)}
                      title="Edit Slide"
                      className="p-1.5 border border-ink-200 text-ink-600 hover:bg-ink-50"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                  <button onClick={() => toggleStatus(s)} className={`px-3 py-1.5 text-xs font-bold border ${s.is_active ? 'border-ink-200 text-ink-600 hover:bg-ink-50' : 'border-green-600 bg-green-50 text-green-700 hover:bg-green-100'}`}>
                    {s.is_active ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => del(s.id)} className="px-3 py-1.5 text-xs font-bold border border-red-200 text-red-600 hover:bg-red-50 flex items-center justify-center gap-1">
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        variant={confirmModal.variant}
        loading={confirmModal.loading}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false })}
      />
    </div>
  );
}
