import React, { useState, useEffect } from 'react';
import { http } from '../../lib/api';
import { toast } from "sonner";
import { Trash2, Edit } from 'lucide-react';

export default function PagesCMS() {
  const [pages, setPages] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [f, setF] = useState({ title: "", slug: "", content_html: "", seo_title: "", seo_description: "" });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await http.get("/admin/cms/pages");
      setPages(data.data);
    } catch (err) { toast.error("Failed to load pages"); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!f.title || !f.slug || !f.content_html) return toast.error("Title, slug and content required");
    try {
      if (editingId) {
        await http.patch(`/admin/cms/pages/${editingId}`, f);
        toast.success("Page updated");
      } else {
        await http.post("/admin/cms/pages", f);
        toast.success("Page created");
      }
      setEditingId(null);
      setF({ title: "", slug: "", content_html: "", seo_title: "", seo_description: "" }); 
      load();
    } catch (err) {
      toast.error(editingId ? "Failed to update page" : "Failed to create page");
    }
  };

  const del = async (id) => { 
    if(!window.confirm("Delete this page? This might break links if hardcoded.")) return;
    try {
      await http.delete(`/admin/cms/pages/${id}`); 
      toast.success("Page deleted");
      load(); 
    } catch (err) {
      toast.error("Failed to delete page");
    }
  };

  const toggleStatus = async (page) => {
    try {
      await http.patch(`/admin/cms/pages/${page.id}`, { is_published: !page.is_published });
      load();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const edit = (page) => {
    setEditingId(page.id);
    setF({
      title: page.title,
      slug: page.slug,
      content_html: page.content_html,
      seo_title: page.seo_title || "",
      seo_description: page.seo_description || ""
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setF({ title: "", slug: "", content_html: "", seo_title: "", seo_description: "" });
  };

  if (loading) return <div className="p-10 text-center text-ink-500">Loading...</div>;

  return (
    <div className="max-w-5xl">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-display font-bold text-obsidian tracking-tight">Static Pages</h2>
          <p className="text-ink-500 mt-1">Manage content pages like About Us, Privacy Policy, Terms, etc.</p>
        </div>
        {editingId && (
          <button onClick={cancelEdit} className="text-sm font-bold border border-ink-200 px-4 py-2 hover:bg-ink-50">Cancel Edit</button>
        )}
      </div>

      <div className="bg-white border border-ink-200 p-6 mb-10 shadow-sm">
        <h3 className="font-display font-bold text-obsidian mb-4">{editingId ? 'Edit Page' : 'Create New Page'}</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-ink-500  tracking-wider mb-2">Page Title *</label>
              <input placeholder="E.g. About Us" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className="w-full border border-ink-200 px-4 py-2 outline-none focus:border-obsidian" />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-500  tracking-wider mb-2">URL Slug *</label>
              <input placeholder="E.g. about-us" value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} disabled={editingId !== null} className={`w-full border border-ink-200 px-4 py-2 outline-none focus:border-obsidian ${editingId ? 'bg-ink-50 text-ink-400' : ''}`} />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-ink-500  tracking-wider mb-2 flex justify-between">
              <span>Page Content (HTML) *</span>
              <span className="font-normal normal-case text-ink-400">Supports full HTML markup</span>
            </label>
            <textarea placeholder="<h1>About Our Store</h1><p>We sell the best shoes...</p>" value={f.content_html} onChange={(e) => setF({ ...f, content_html: e.target.value })} rows={12} className="w-full border border-ink-200 px-4 py-2 outline-none focus:border-obsidian font-mono text-sm" />
          </div>

          <div className="border-t border-ink-100 pt-4 mt-4">
            <h4 className="text-sm font-bold text-obsidian mb-3">Search Engine Optimization (SEO)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink-500  tracking-wider mb-2">Meta Title</label>
                <input placeholder="Defaults to Page Title if empty" value={f.seo_title} onChange={(e) => setF({ ...f, seo_title: e.target.value })} className="w-full border border-ink-200 px-4 py-2 outline-none focus:border-obsidian" />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-500  tracking-wider mb-2">Meta Description</label>
                <input placeholder="Short summary for search engines" value={f.seo_description} onChange={(e) => setF({ ...f, seo_description: e.target.value })} className="w-full border border-ink-200 px-4 py-2 outline-none focus:border-obsidian" />
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center gap-3">
            <button onClick={save} className="bg-obsidian text-white font-bold px-6 py-2.5 hover:bg-fire transition-colors">
              {editingId ? 'Save Changes' : 'Create Page'}
            </button>
            {editingId && <button onClick={cancelEdit} className="text-ink-500 hover:text-obsidian font-bold px-4 py-2.5">Cancel</button>}
          </div>
        </div>
      </div>

      <div className="bg-white border border-ink-200 rounded-none overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-ink-50 border-b border-ink-200 text-xs  tracking-wider text-ink-500">
            <tr>
              <th className="p-4 font-bold">Page Title</th>
              <th className="p-4 font-bold">URL Route</th>
              <th className="p-4 font-bold">Status</th>
              <th className="p-4 font-bold">Last Updated</th>
              <th className="p-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {pages.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-ink-500">No static pages found.</td></tr>
            ) : (
              pages.map(p => (
                <tr key={p.id} className="hover:bg-ink-50/50 transition-colors">
                  <td className="p-4 font-bold text-obsidian">{p.title}</td>
                  <td className="p-4 text-sm text-ink-600 font-mono">/pages/{p.slug}</td>
                  <td className="p-4">
                    <button onClick={() => toggleStatus(p)} className={`text-xs font-bold px-2 py-0.5 rounded ${p.is_published ? 'bg-green-100 text-green-700' : 'bg-ink-100 text-ink-600'}`}>
                      {p.is_published ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="p-4 text-sm text-ink-500">{new Date(p.updated_at).toLocaleDateString()}</td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => edit(p)} className="text-blue-500 hover:text-blue-700 p-2" title="Edit"><Edit size={16}/></button>
                    <button onClick={() => del(p.id)} className="text-red-500 hover:text-red-700 p-2" title="Delete"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

