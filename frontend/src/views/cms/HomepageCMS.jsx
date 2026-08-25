import React, { useState, useEffect } from 'react';
import { Reorder } from 'framer-motion';
import { http } from '../../lib/api';
import { toast } from "sonner";
import { GripVertical, Eye, EyeOff, Settings } from 'lucide-react';

export default function HomepageCMS({ setActiveTab }) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await http.get('/admin/cms/homepage-sections');
      setSections(res.data.data);
    } catch (err) {
      toast.error('Failed to load sections');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleReorder = async (newOrder) => {
    setSections(newOrder);
    try {
      await http.patch('/admin/cms/homepage-sections/reorder', {
        orderedIds: newOrder.map(s => s.id)
      });
      toast.success('Order saved', { id: 'reorder', duration: 1000 });
    } catch (err) {
      toast.error('Failed to save order');
      load(); // revert
    }
  };

  const toggleVisibility = async (section) => {
    try {
      const newStatus = !section.is_active;
      await http.patch(`/admin/cms/homepage-sections/${section.id}`, { is_active: newStatus });
      setSections(sections.map(s => s.id === section.id ? { ...s, is_active: newStatus } : s));
      toast.success(`Section ${newStatus ? 'visible' : 'hidden'}`);
    } catch (err) {
      toast.error('Failed to update visibility');
    }
  };

  const openSettings = (section) => {
    const map = {
      'hero': 'hero',
      'categories': 'categories',
      'new_arrivals': 'product_sections',
      'best_sellers': 'product_sections',
      'trending': 'product_sections',
      'promotional_banner': 'promo',
      'flash_sale': 'flash_sale',
      'testimonials': 'testimonials'
    };
    if (map[section.type] && setActiveTab) {
      setActiveTab(map[section.type]);
    } else {
      toast.error('No specific settings available for this section');
    }
  };

  const formatType = (type) => {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  if (loading) return <div className="p-10 text-center text-ink-500">Loading...</div>;

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h2 className="text-2xl font-display font-bold text-obsidian tracking-tight">Homepage Layout</h2>
        <p className="text-ink-500 mt-1">Drag and drop sections to change their order on the storefront homepage.</p>
      </div>

      <div className="bg-white border border-ink-200 rounded-none overflow-hidden">
        <div className="bg-ink-50 px-4 py-3 border-b border-ink-200 font-bold text-sm text-obsidian flex justify-between">
          <span>Homepage Sections</span>
          <span>Controls</span>
        </div>
        
        <Reorder.Group axis="y" values={sections} onReorder={handleReorder} className="divide-y divide-ink-100">
          {sections.map((section) => (
            <Reorder.Item 
              key={section.id} 
              value={section} 
              className={`flex items-center justify-between p-4 bg-white hover:bg-ink-50/50 transition-colors cursor-grab active:cursor-grabbing ${!section.is_active ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-4">
                <GripVertical className="text-ink-400" size={18} />
                <div>
                  <div className="font-bold text-obsidian">{formatType(section.type)}</div>
                  <div className="text-xs text-ink-500">{section.is_active ? '🟢 Active' : '⚪ Hidden'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => toggleVisibility(section)} 
                  className="p-2 text-ink-500 hover:text-obsidian hover:bg-ink-100 transition-colors"
                  title={section.is_active ? "Hide on Storefront" : "Show on Storefront"}
                >
                  {section.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
                <button 
                  onClick={() => openSettings(section)}
                  className="p-2 text-ink-500 hover:text-obsidian hover:bg-ink-100 transition-colors"
                  title="Section Settings"
                >
                  <Settings size={18} />
                </button>
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>
      
      <div className="mt-6 text-sm text-ink-500 bg-blue-50 text-blue-800 p-4 border border-blue-200">
        <strong>Note:</strong> Changes are saved automatically when you drop a section.
      </div>
    </div>
  );
}
