import React, { useState, useEffect } from 'react';
import { http } from '../../lib/api';
import { toast } from "sonner";
import { Trash2, Star } from 'lucide-react';

export default function TestimonialsCMS() {
  const [testimonials, setTestimonials] = useState([]);
  const [f, setF] = useState({ author_name: "", author_meta: "Verified Customer", content: "", rating: 5 });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await http.get("/admin/cms/testimonials");
      setTestimonials(data.data);
    } catch (err) { toast.error("Failed to load testimonials"); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!f.author_name || !f.content) return toast.error("Author name and content required");
    try {
      await http.post("/admin/cms/testimonials", {
        ...f,
        rating: parseInt(f.rating, 10)
      });
      toast.success("Testimonial added"); 
      setF({ author_name: "", author_meta: "Verified Customer", content: "", rating: 5 }); 
      load();
    } catch (err) {
      toast.error("Failed to add testimonial");
    }
  };

  const del = async (id) => { 
    if(!window.confirm("Delete this testimonial?")) return;
    try {
      await http.delete(`/admin/cms/testimonials/${id}`); 
      toast.success("Testimonial deleted");
      load(); 
    } catch (err) {
      toast.error("Failed to delete testimonial");
    }
  };

  const toggleStatus = async (testimonial) => {
    try {
      await http.patch(`/admin/cms/testimonials/${testimonial.id}`, { is_published: !testimonial.is_published });
      load();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  if (loading) return <div className="p-10 text-center text-ink-500">Loading...</div>;

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h2 className="text-2xl font-display font-bold text-obsidian tracking-tight">Testimonials</h2>
        <p className="text-ink-500 mt-1">Manage marketing testimonials that appear on the storefront.</p>
      </div>

      <div className="bg-white border border-ink-200 p-6 mb-10 shadow-sm">
        <h3 className="font-display font-bold text-obsidian mb-4">Add Manual Testimonial</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-ink-500  tracking-wider mb-2">Author Name *</label>
              <input placeholder="E.g. Ahmed Khan" value={f.author_name} onChange={(e) => setF({ ...f, author_name: e.target.value })} className="w-full border border-ink-200 px-4 py-2 outline-none focus:border-obsidian" />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-500  tracking-wider mb-2">Author Meta</label>
              <input placeholder="E.g. Verified Customer" value={f.author_meta} onChange={(e) => setF({ ...f, author_meta: e.target.value })} className="w-full border border-ink-200 px-4 py-2 outline-none focus:border-obsidian" />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-ink-500  tracking-wider mb-2">Rating</label>
            <select value={f.rating} onChange={(e) => setF({ ...f, rating: e.target.value })} className="w-full border border-ink-200 px-4 py-2 outline-none focus:border-obsidian bg-white">
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-500  tracking-wider mb-2">Testimonial Content *</label>
            <textarea placeholder="Absolutely love the quality..." value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} rows={3} className="w-full border border-ink-200 px-4 py-2 outline-none focus:border-obsidian" />
          </div>

          <div className="pt-2">
            <button onClick={add} className="bg-obsidian text-white font-bold px-6 py-2.5 hover:bg-fire transition-colors">Add Testimonial</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {testimonials.length === 0 ? (
          <div className="col-span-full p-8 text-center border border-ink-200 text-ink-500 bg-ink-50">No testimonials found.</div>
        ) : (
          testimonials.map((t) => (
            <div key={t.id} className={`border border-ink-200 bg-white shadow-sm p-5 relative group ${!t.is_published ? 'opacity-60' : ''}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex text-fire">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill={i < t.rating ? "currentColor" : "none"} className={i < t.rating ? "text-fire" : "text-ink-200"} />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleStatus(t)} className={`text-xs font-bold px-2 py-0.5 rounded ${t.is_published ? 'bg-green-100 text-green-700' : 'bg-ink-100 text-ink-600'}`}>
                    {t.is_published ? 'Published' : 'Hidden'}
                  </button>
                </div>
              </div>
              
              <p className="text-obsidian italic text-sm mb-4">"{t.content}"</p>
              
              <div className="flex justify-between items-end">
                <div>
                  <div className="font-bold text-obsidian text-sm">{t.author_name}</div>
                  {t.author_meta && <div className="text-ink-400 text-xs">{t.author_meta}</div>}
                </div>
                <button onClick={() => del(t.id)} className="text-ink-300 hover:text-red-500 transition-colors p-1"><Trash2 size={16} /></button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

