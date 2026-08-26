import React, { useState, useEffect } from 'react';
import { http } from '../../lib/api';
import { toast } from "sonner";

export default function ProductSectionsCMS() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await http.get('/admin/cms/homepage-sections');
      // Filter only product-related sections
      const prodSections = res.data.data.filter(s => ['new_arrivals', 'best_sellers', 'trending'].includes(s.type));
      setSections(prodSections);
    } catch (err) {
      toast.error('Failed to load sections');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const saveSettings = async (sectionId, settings) => {
    try {
      await http.patch(`/admin/cms/homepage-sections/${sectionId}`, { settings });
      toast.success('Section updated');
      load();
    } catch (err) {
      toast.error('Failed to update section');
    }
  };

  const toggleVisibility = async (section) => {
    try {
      await http.patch(`/admin/cms/homepage-sections/${section.id}`, { is_active: !section.is_active });
      load();
    } catch (err) {
      toast.error('Failed to update visibility');
    }
  };

  const formatType = (type) => type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  if (loading) return <div className="p-10 text-center text-ink-500">Loading...</div>;

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h2 className="text-2xl font-display font-bold text-obsidian tracking-tight">Product Sections</h2>
        <p className="text-ink-500 mt-1">Configure automated product carousels for the storefront.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map(section => {
          const settings = section.settings || { limit: 8, title: formatType(section.type) };
          return (
            <div key={section.id} className={`border p-5 bg-white transition-opacity ${!section.is_active ? 'opacity-70 border-ink-200' : 'border-ink-200 shadow-sm'}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-display font-bold text-obsidian text-lg">{formatType(section.type)}</h3>
                  <p className="text-xs text-ink-500 mt-1">
                    {section.type === 'new_arrivals' ? 'Automatically shows the latest added products.' :
                     section.type === 'best_sellers' ? 'Automatically shows top-selling products based on order history.' :
                     'Automatically shows trending products based on views/purchases.'}
                  </p>
                </div>
                <button 
                  onClick={() => toggleVisibility(section)}
                  className={`text-xs font-bold px-3 py-1 rounded-full ${section.is_active ? 'bg-green-100 text-green-700' : 'bg-ink-100 text-ink-600'}`}
                >
                  {section.is_active ? 'Active' : 'Hidden'}
                </button>
              </div>

              <div className="space-y-4 border-t border-ink-100 pt-4 mt-2">
                <div>
                  <label className="block text-xs font-bold text-ink-500  tracking-wider mb-2">Section Title</label>
                  <input 
                    type="text" 
                    value={settings.title || ''} 
                    onChange={e => setSections(sections.map(s => s.id === section.id ? {...s, settings: {...settings, title: e.target.value}} : s))}
                    className="w-full border border-ink-200 px-3 py-2 outline-none focus:border-obsidian text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-500  tracking-wider mb-2">Product Limit</label>
                  <select 
                    value={settings.limit || 8} 
                    onChange={e => setSections(sections.map(s => s.id === section.id ? {...s, settings: {...settings, limit: parseInt(e.target.value, 10)}} : s))}
                    className="w-full border border-ink-200 px-3 py-2 outline-none focus:border-obsidian text-sm bg-white"
                  >
                    <option value={4}>4 Products</option>
                    <option value={8}>8 Products</option>
                    <option value={12}>12 Products</option>
                    <option value={16}>16 Products</option>
                  </select>
                </div>
                
                <div className="pt-2">
                  <button 
                    onClick={() => saveSettings(section.id, settings)}
                    className="bg-obsidian text-white font-bold px-4 py-2 text-sm hover:bg-fire transition-colors w-full"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

