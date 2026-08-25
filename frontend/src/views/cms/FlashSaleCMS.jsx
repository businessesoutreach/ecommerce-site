import React, { useState, useEffect } from 'react';
import { http } from '../../lib/api';
import { toast } from "sonner";

export default function FlashSaleCMS() {
  const [section, setSection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Flash Sale state mapped from settings JSON
  const [f, setF] = useState({
    title: "SUMMER FLASH SALE",
    subtitle: "Up to 50% off selected products",
    start_date: "",
    end_date: "",
    show_countdown: true,
    discount_type: "percentage",
    discount_value: 20
  });

  const load = async () => {
    try {
      const res = await http.get('/admin/cms/homepage-sections');
      const flashSection = res.data.data.find(s => s.type === 'flash_sale');
      if (flashSection) {
        setSection(flashSection);
        if (flashSection.settings) {
          setF(prev => ({ ...prev, ...flashSection.settings }));
        }
      }
    } catch (err) {
      toast.error('Failed to load flash sale settings');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!section) return;
    setSaving(true);
    try {
      await http.patch(`/admin/cms/homepage-sections/${section.id}`, { 
        settings: f 
      });
      toast.success('Flash Sale updated');
      load();
    } catch (err) {
      toast.error('Failed to update flash sale');
    }
    setSaving(false);
  };

  const toggleVisibility = async () => {
    if (!section) return;
    try {
      await http.patch(`/admin/cms/homepage-sections/${section.id}`, { is_active: !section.is_active });
      setSection({ ...section, is_active: !section.is_active });
      toast.success(section.is_active ? 'Flash sale hidden' : 'Flash sale active');
    } catch (err) {
      toast.error('Failed to update visibility');
    }
  };

  if (loading) return <div className="p-10 text-center text-ink-500">Loading...</div>;
  if (!section) return <div className="p-10 text-center text-ink-500">Flash Sale section not initialized in database.</div>;

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h2 className="text-2xl font-display font-bold text-obsidian tracking-tight">Flash Sale</h2>
        <p className="text-ink-500 mt-1">Configure limited-time promotional events.</p>
      </div>

      <div className="bg-white border border-ink-200 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-ink-100">
          <h3 className="font-display font-bold text-obsidian">Campaign Settings</h3>
          <button 
            onClick={toggleVisibility}
            className={`text-sm font-bold px-4 py-2 flex items-center gap-2 transition-colors ${section.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'}`}
          >
            {section.is_active ? '🟢 ACTIVE ON STOREFRONT' : '⚪ INACTIVE (HIDDEN)'}
          </button>
        </div>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">Campaign Title</label>
              <input placeholder="E.g. SUMMER FLASH SALE" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className="w-full border border-ink-200 px-4 py-2 outline-none focus:border-obsidian font-bold" />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">Subtitle</label>
              <input placeholder="E.g. Up to 50% off selected products" value={f.subtitle} onChange={(e) => setF({ ...f, subtitle: e.target.value })} className="w-full border border-ink-200 px-4 py-2 outline-none focus:border-obsidian" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">Start Date</label>
              <input type="datetime-local" value={f.start_date} onChange={(e) => setF({ ...f, start_date: e.target.value })} className="w-full border border-ink-200 px-4 py-2 outline-none focus:border-obsidian" />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">End Date</label>
              <input type="datetime-local" value={f.end_date} onChange={(e) => setF({ ...f, end_date: e.target.value })} className="w-full border border-ink-200 px-4 py-2 outline-none focus:border-obsidian" />
            </div>
          </div>

          <div className="border-t border-ink-100 pt-6">
            <h4 className="font-bold text-obsidian mb-4">Display & Logic</h4>
            
            <div className="flex items-center gap-3 mb-6">
              <input type="checkbox" id="show_countdown" checked={f.show_countdown} onChange={(e) => setF({ ...f, show_countdown: e.target.checked })} className="w-4 h-4 text-obsidian border-ink-300 rounded focus:ring-obsidian" />
              <label htmlFor="show_countdown" className="text-sm font-bold text-obsidian">Show live countdown timer on storefront</label>
            </div>

            <div className="bg-ink-50 border border-ink-200 p-4">
              <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-3">Discount Application</label>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="discount_type" value="existing" checked={f.discount_type === 'existing'} onChange={() => setF({ ...f, discount_type: 'existing' })} className="w-4 h-4 text-obsidian" />
                  <span className="text-sm font-bold">Use existing product discounts (Manual)</span>
                </label>
                
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" name="discount_type" value="percentage" checked={f.discount_type === 'percentage'} onChange={() => setF({ ...f, discount_type: 'percentage' })} className="w-4 h-4 text-obsidian" />
                    <span className="text-sm font-bold">Apply global percentage discount</span>
                  </label>
                  
                  {f.discount_type === 'percentage' && (
                    <div className="flex items-center ml-4">
                      <input type="number" min="1" max="99" value={f.discount_value} onChange={(e) => setF({ ...f, discount_value: parseInt(e.target.value) })} className="w-16 border border-ink-200 px-2 py-1 text-sm outline-none text-center" />
                      <span className="ml-2 text-sm font-bold text-ink-500">% OFF</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-ink-100 flex items-center justify-between">
            <button onClick={save} disabled={saving} className="bg-obsidian text-white font-bold px-8 py-3 hover:bg-fire transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Flash Sale'}
            </button>
            
            {section.is_active && (
              <div className="text-sm text-green-700 font-bold bg-green-50 px-4 py-2 border border-green-200 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                Flash Sale is currently LIVE
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
